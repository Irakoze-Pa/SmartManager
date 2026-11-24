import { Types } from 'mongoose';
import { AccountModel, JournalEntryModel } from '../accounting/accounting.model.js';
import { DryCleaningOrderModel } from './dry-cleaning.model.js';

type ServiceAccount = { _id: Types.ObjectId; code: string; name: string };
type ServiceJournalArgs = {
  businessId: string | Types.ObjectId;
  userId: string | Types.ObjectId;
  branchId: string | Types.ObjectId;
  customerId: string | Types.ObjectId;
  orderId: string | Types.ObjectId;
  orderNumber: string;
  date: Date;
};

const systemAccounts = [
  { code: '1000', name: 'Cash and cash equivalents', type: 'asset', normalBalance: 'debit', systemKey: 'cash' },
  { code: '1100', name: 'Accounts receivable', type: 'asset', normalBalance: 'debit', systemKey: 'accounts_receivable' },
  { code: '2200', name: 'Customer deposits', type: 'liability', normalBalance: 'credit', systemKey: 'customer_deposits' },
  { code: '4200', name: 'Dry cleaning service revenue', type: 'revenue', normalBalance: 'credit', systemKey: 'dry_cleaning_service_revenue' },
] as const;
const accountCache = new Map<string, Promise<Map<string, ServiceAccount & { systemKey: string }>>>();
const syncRuns = new Map<string, Promise<void>>();

const ensureServiceAccounts = async (businessId: Types.ObjectId) => {
  const accounts = await Promise.all(systemAccounts.map(({ code, name, type, normalBalance, systemKey }) => AccountModel.findOneAndUpdate(
    { businessId, systemKey },
    { $setOnInsert: { businessId, code, name, type, normalBalance, systemKey, subtype: 'dry_cleaning' } },
    { upsert: true, new: true },
  ).lean()));
  return new Map(accounts.map((account) => [account.systemKey, account as ServiceAccount & { systemKey: string }]));
};

const serviceAccounts = (businessId: Types.ObjectId) => {
  const key = businessId.toString();
  let cached = accountCache.get(key);
  if (!cached) {
    cached = ensureServiceAccounts(businessId);
    accountCache.set(key, cached);
    void cached.catch(() => { if (accountCache.get(key) === cached) accountCache.delete(key); });
  }
  return cached;
};

const journalNumber = () => `JE-DC-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

const postJournal = async (args: ServiceJournalArgs & { sourceType: string; sourceId: string | Types.ObjectId; description: string; lines: Array<{ account: ServiceAccount; debit: number; credit: number; description: string }> }) => {
  const businessId = new Types.ObjectId(args.businessId);
  const sourceId = new Types.ObjectId(args.sourceId);
  if (await JournalEntryModel.exists({ businessId, sourceType: args.sourceType, sourceId })) return;
  const lines = args.lines.map((line) => ({
    accountId: line.account._id,
    accountCode: line.account.code,
    accountName: line.account.name,
    description: line.description,
    debit: line.debit,
    credit: line.credit,
    branchId: new Types.ObjectId(args.branchId),
    customerId: new Types.ObjectId(args.customerId),
  }));
  try {
    await JournalEntryModel.create({ businessId, journalNumber: journalNumber(), date: args.date, description: args.description, sourceType: args.sourceType, sourceId, createdBy: new Types.ObjectId(args.userId), lines });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000 || !await JournalEntryModel.exists({ businessId, sourceType: args.sourceType, sourceId })) throw error;
  }
};

export const postDryCleaningPayment = async (args: ServiceJournalArgs & { paymentId: string | Types.ObjectId; amount: number; method: string; orderAlreadyPickedUp: boolean }) => {
  if (args.amount <= 0) return;
  const accounts = await serviceAccounts(new Types.ObjectId(args.businessId));
  const cash = accounts.get('cash');
  const creditAccount = accounts.get(args.orderAlreadyPickedUp ? 'accounts_receivable' : 'customer_deposits');
  if (!cash || !creditAccount) throw new Error('Dry cleaning accounting accounts are unavailable');
  const kind = args.orderAlreadyPickedUp ? 'balance payment' : 'customer deposit';
  await postJournal({ ...args, sourceType: 'dry_cleaning_payment', sourceId: args.paymentId, description: `Dry cleaning ${kind} · ${args.orderNumber}`, lines: [
    { account: cash, debit: args.amount, credit: 0, description: `Payment received · ${args.method.replaceAll('_', ' ')}` },
    { account: creditAccount, debit: 0, credit: args.amount, description: kind },
  ] });
};

export const postDryCleaningHandover = async (args: ServiceJournalArgs & { total: number; amountPaid: number }) => {
  if (args.total <= 0) return;
  const accounts = await serviceAccounts(new Types.ObjectId(args.businessId));
  const receivable = accounts.get('accounts_receivable');
  const deposits = accounts.get('customer_deposits');
  const revenue = accounts.get('dry_cleaning_service_revenue');
  if (!receivable || !deposits || !revenue) throw new Error('Dry cleaning accounting accounts are unavailable');
  const balance = Math.max(0, args.total - args.amountPaid);
  const lines = [
    ...(args.amountPaid > 0 ? [{ account: deposits, debit: args.amountPaid, credit: 0, description: 'Apply customer deposits to completed service' }] : []),
    ...(balance > 0 ? [{ account: receivable, debit: balance, credit: 0, description: 'Customer balance due for completed service' }] : []),
    { account: revenue, debit: 0, credit: args.total, description: 'Garment care service revenue' },
  ];
  await postJournal({ ...args, sourceType: 'dry_cleaning_handover', sourceId: args.orderId, description: `Dry cleaning service completed · ${args.orderNumber}`, lines });
};

export const syncDryCleaningAccounting = (businessIdValue: string, userIdValue: string) => {
  const key = businessIdValue.toString();
  const existing = syncRuns.get(key);
  if (existing) return existing;
  const sync = (async () => {
    const businessId = new Types.ObjectId(businessIdValue);
    const cursor = DryCleaningOrderModel.find({ businessId }).lean().cursor();
    for await (const order of cursor) {
      const pickupEvent = order.activity?.find((entry) => entry.action === 'status_changed' && entry.description.includes('picked_up'));
      const pickedUpAt = order.pickedUpAt ?? pickupEvent?.occurredAt ?? (order.status === 'picked_up' ? order.updatedAt : undefined);
      const pickupDate = pickedUpAt ? new Date(pickedUpAt) : undefined;
      const payments = order.payments ?? [];
      const paidAtPickup = pickupDate ? payments.filter((payment) => new Date(payment.recordedAt) <= pickupDate).reduce((sum, payment) => sum + payment.amount, 0) : 0;
      for (const payment of payments) {
        if (!payment._id) continue;
        const recordedAt = new Date(payment.recordedAt);
        await postDryCleaningPayment({ businessId, userId: userIdValue, branchId: order.branchId, customerId: order.customerId, orderId: order._id, paymentId: payment._id, orderNumber: order.orderNumber, date: recordedAt, amount: payment.amount, method: payment.method, orderAlreadyPickedUp: Boolean(pickupDate && recordedAt > pickupDate) });
      }
      if (order.status === 'picked_up' && pickupDate) await postDryCleaningHandover({ businessId, userId: userIdValue, branchId: order.branchId, customerId: order.customerId, orderId: order._id, orderNumber: order.orderNumber, date: pickupDate, total: order.total, amountPaid: paidAtPickup });
    }
  })();
  syncRuns.set(key, sync);
  void sync.catch(() => { if (syncRuns.get(key) === sync) syncRuns.delete(key); });
  return sync;
};
