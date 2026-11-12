import { Schema, model } from 'mongoose';

export const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
const tenant = { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true };

const accountSchema = new Schema({ businessId: tenant, code: { type: String, required: true, trim: true }, name: { type: String, required: true, trim: true }, type: { type: String, enum: accountTypes, required: true }, subtype: { type: String, default: '' }, normalBalance: { type: String, enum: ['debit', 'credit'], required: true }, systemKey: { type: String, default: '' }, isActive: { type: Boolean, default: true }, allowManualPosting: { type: Boolean, default: true } }, { timestamps: true, versionKey: false });
accountSchema.index({ businessId: 1, code: 1 }, { unique: true });
accountSchema.index({ businessId: 1, systemKey: 1 }, { unique: true, partialFilterExpression: { systemKey: { $gt: '' } } });
export const AccountModel = model('Account', accountSchema);

const journalLineSchema = new Schema({ accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true }, accountCode: { type: String, required: true }, accountName: { type: String, required: true }, description: { type: String, default: '' }, debit: { type: Number, min: 0, default: 0 }, credit: { type: Number, min: 0, default: 0 }, branchId: { type: Schema.Types.ObjectId, ref: 'Branch' }, customerId: { type: Schema.Types.ObjectId, ref: 'Customer' }, supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' } }, { _id: true });
const journalSchema = new Schema({ businessId: tenant, journalNumber: { type: String, required: true }, date: { type: Date, required: true }, description: { type: String, required: true }, sourceType: { type: String, default: 'manual' }, sourceId: { type: Schema.Types.ObjectId }, status: { type: String, enum: ['draft', 'posted', 'reversed'], default: 'posted' }, lines: { type: [journalLineSchema], required: true }, createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, approvedBy: { type: Schema.Types.ObjectId, ref: 'User' }, reversalOf: { type: Schema.Types.ObjectId, ref: 'JournalEntry' } }, { timestamps: true, versionKey: false });
journalSchema.index({ businessId: 1, journalNumber: 1 }, { unique: true });
journalSchema.index({ businessId: 1, date: -1 });
journalSchema.index({ businessId: 1, sourceType: 1, sourceId: 1 }, { unique: true, sparse: true });
export const JournalEntryModel = model('JournalEntry', journalSchema);

const financialAccountSchema = new Schema({ businessId: tenant, name: { type: String, required: true }, type: { type: String, enum: ['cash', 'bank', 'mobile_money', 'card_clearing'], required: true }, provider: { type: String, default: '' }, accountNumber: { type: String, default: '' }, currency: { type: String, default: 'RWF' }, ledgerAccountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true }, branchId: { type: Schema.Types.ObjectId, ref: 'Branch' }, openingBalance: { type: Number, default: 0 }, isActive: { type: Boolean, default: true } }, { timestamps: true, versionKey: false });
financialAccountSchema.index({ businessId: 1, name: 1 }, { unique: true });
export const FinancialAccountModel = model('FinancialAccount', financialAccountSchema);

const contactDocumentSchema = new Schema({ businessId: tenant, kind: { type: String, enum: ['receivable', 'payable'], required: true }, documentNumber: { type: String, required: true }, contactId: { type: Schema.Types.ObjectId, required: true }, contactName: { type: String, required: true }, issueDate: { type: Date, required: true }, dueDate: { type: Date, required: true }, subtotal: { type: Number, min: 0, required: true }, tax: { type: Number, min: 0, default: 0 }, total: { type: Number, min: 0, required: true }, amountPaid: { type: Number, min: 0, default: 0 }, status: { type: String, enum: ['draft', 'open', 'partial', 'paid', 'void'], default: 'open' }, branchId: { type: Schema.Types.ObjectId, ref: 'Branch' }, createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: true, versionKey: false });
contactDocumentSchema.index({ businessId: 1, kind: 1, documentNumber: 1 }, { unique: true });
contactDocumentSchema.index({ businessId: 1, kind: 1, dueDate: 1, status: 1 });
export const ContactDocumentModel = model('ContactDocument', contactDocumentSchema);

const budgetLineSchema = new Schema({ accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true }, accountCode: String, accountName: String, amount: { type: Number, required: true }, branchId: { type: Schema.Types.ObjectId, ref: 'Branch' } }, { _id: true });
const budgetSchema = new Schema({ businessId: tenant, name: { type: String, required: true }, fiscalYear: { type: Number, required: true }, scenario: { type: String, enum: ['budget', 'best', 'base', 'worst'], default: 'budget' }, status: { type: String, enum: ['draft', 'approved', 'locked'], default: 'draft' }, lines: { type: [budgetLineSchema], default: [] }, createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: true, versionKey: false });
budgetSchema.index({ businessId: 1, fiscalYear: 1, scenario: 1 }, { unique: true });
export const BudgetModel = model('Budget', budgetSchema);

const assetSchema = new Schema({ businessId: tenant, assetNumber: { type: String, required: true }, name: { type: String, required: true }, category: { type: String, required: true }, acquisitionDate: { type: Date, required: true }, cost: { type: Number, min: 0, required: true }, residualValue: { type: Number, min: 0, default: 0 }, usefulLifeMonths: { type: Number, min: 1, required: true }, accumulatedDepreciation: { type: Number, min: 0, default: 0 }, status: { type: String, enum: ['active', 'disposed', 'fully_depreciated'], default: 'active' }, branchId: { type: Schema.Types.ObjectId, ref: 'Branch' }, createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true } }, { timestamps: true, versionKey: false });
assetSchema.index({ businessId: 1, assetNumber: 1 }, { unique: true });
export const FixedAssetModel = model('FixedAsset', assetSchema);

const taxCodeSchema = new Schema({ businessId: tenant, code: { type: String, required: true }, name: { type: String, required: true }, rate: { type: Number, min: 0, max: 100, required: true }, type: { type: String, enum: ['sales', 'purchase', 'withholding'], required: true }, isActive: { type: Boolean, default: true }, outputAccountId: { type: Schema.Types.ObjectId, ref: 'Account' }, inputAccountId: { type: Schema.Types.ObjectId, ref: 'Account' } }, { timestamps: true, versionKey: false });
taxCodeSchema.index({ businessId: 1, code: 1 }, { unique: true });
export const TaxCodeModel = model('TaxCode', taxCodeSchema);

const auditSchema = new Schema({ businessId: tenant, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, action: { type: String, required: true }, entityType: { type: String, required: true }, entityId: { type: Schema.Types.ObjectId }, metadata: { type: Schema.Types.Mixed }, occurredAt: { type: Date, default: Date.now } }, { versionKey: false });
auditSchema.index({ businessId: 1, occurredAt: -1 });
export const TenantAuditModel = model('TenantAudit', auditSchema);
