import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Banknote, Plus, Search, UserRound, X } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';
import { useAuth } from '../features/auth/AuthContext';
import { getApiErrorMessage } from '../services/apiClient';
import { createCustomer, getCustomers, recordCreditPayment, setCustomerStatus } from '../services/customerService';
import type { Customer } from '../types/api';

const money = (value: number) => `${value.toLocaleString()} RWF`;

export function CustomersPage() {
  const { identity } = useAuth();
  const canChangeStatus = ['owner', 'admin', 'manager'].includes(identity?.user.role ?? '');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setCustomers(await getCustomers()); } catch (requestError) { setError(getApiErrorMessage(requestError, 'Customers could not be loaded.')); } }, []);
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => customers.filter((customer) => `${customer.name} ${customer.phone} ${customer.email}`.toLowerCase().includes(search.toLowerCase())), [customers, search]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(''); const form = event.currentTarget; const data = new FormData(form);
    try { await createCustomer({ name: String(data.get('name')), phone: String(data.get('phone')), email: String(data.get('email')), notes: String(data.get('notes')) }); form.reset(); setShowForm(false); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError, 'Customer could not be created.')); }
    finally { setBusy(false); }
  };
  const collectPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!paymentCustomer) return; setBusy(true); setError(''); setNotice(''); const data = new FormData(event.currentTarget);
    try { const amount = Number(data.get('amount')); await recordCreditPayment(paymentCustomer.id, { amount, method: String(data.get('method')) as 'cash' | 'mtn_momo' | 'airtel_money' | 'card' | 'bank_transfer' }); setNotice(`Payment of ${money(amount)} recorded for ${paymentCustomer.name}.`); setPaymentCustomer(null); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError, 'Credit payment could not be recorded.')); }
    finally { setBusy(false); }
  };
  const toggle = async (customer: Customer) => { setBusy(true); setError(''); try { await setCustomerStatus(customer.id, !customer.isActive); await load(); } catch (requestError) { setError(getApiErrorMessage(requestError, 'Customer status could not be changed.')); } finally { setBusy(false); } };

  return <div className="mx-auto max-w-[1300px]">
    <PageHeading eyebrow="Relationships" title="Customers" description="Manage customer contacts, purchase history, and credit payments." action={<button onClick={() => setShowForm((current) => !current)} className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-500 px-4 py-3 text-sm font-bold text-white">{showForm ? <X size={17} /> : <Plus size={17} />}{showForm ? 'Close form' : 'Add customer'}</button>} />
    {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
    {showForm && <form onSubmit={(event) => void submit(event)} className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{([['name','Customer name','text'],['phone','Phone','tel'],['email','Email','email'],['notes','Notes','text']] as const).map(([name,label,type]) => <label key={name} className="text-sm font-semibold">{label}<input name={name} type={type} required={name === 'name'} className="mt-2 h-11 w-full rounded-xl border border-stone-200 px-3 font-normal" /></label>)}</div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-stone-200 px-5 py-3 text-sm font-bold">Cancel</button><button disabled={busy} className="rounded-xl bg-brand-charcoal-900 px-5 py-3 text-sm font-bold text-white">{busy ? 'Saving…' : 'Save customer'}</button></div></form>}
    {paymentCustomer && <form onSubmit={(event) => void collectPayment(event)} className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-amber-950">Collect credit payment · {paymentCustomer.name}</p><p className="mt-1 text-sm text-amber-800">Outstanding balance: {money(paymentCustomer.creditBalance)}</p></div><button type="button" aria-label="Close payment form" onClick={() => setPaymentCustomer(null)}><X size={19} /></button></div><div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]"><label className="text-sm font-semibold">Amount received<input name="amount" type="number" min="1" max={paymentCustomer.creditBalance} step="1" defaultValue={paymentCustomer.creditBalance} required className="mt-2 h-11 w-full rounded-xl border border-amber-200 bg-white px-3 font-normal" /></label><label className="text-sm font-semibold">Payment method<select name="method" className="mt-2 h-11 w-full rounded-xl border border-amber-200 bg-white px-3 font-normal"><option value="cash">Cash</option><option value="mtn_momo">MTN MoMo</option><option value="airtel_money">Airtel Money</option><option value="card">Bank card</option><option value="bank_transfer">Bank transfer</option></select></label><button disabled={busy} className="self-end rounded-xl bg-amber-800 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Recording…' : 'Record payment'}</button></div></form>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Summary label="Customers" value={String(customers.length)} /><Summary label="Linked sales" value={String(customers.reduce((sum, customer) => sum + customer.visits, 0))} /><Summary label="Customer revenue" value={money(customers.reduce((sum, customer) => sum + customer.totalSpent, 0))} orange /><Summary label="Credit outstanding" value={money(customers.reduce((sum, customer) => sum + customer.creditBalance, 0))} credit /></div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"><div className="border-b border-stone-100 p-5"><div className="relative max-w-sm"><Search className="absolute left-3 top-3 text-stone-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, or email" className="h-11 w-full rounded-xl border border-stone-200 pl-10 pr-3 text-sm" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left"><thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500"><tr><th className="px-6 py-3">Customer</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Visits</th><th className="px-5 py-3">Total spent</th><th className="px-5 py-3">Credit due</th><th className="px-5 py-3">Last purchase</th><th className="px-6 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-stone-100">{filtered.map((customer) => <tr key={customer.id} className={customer.isActive ? '' : 'opacity-55'}><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-orange-50 text-brand-orange-600"><UserRound size={17} /></span><div><p className="text-sm font-semibold">{customer.name}</p><p className="text-xs text-stone-400">{customer.notes || 'No notes'}</p></div></div></td><td className="px-5 py-4 text-sm text-stone-600">{customer.phone || customer.email || '—'}</td><td className="px-5 py-4 text-sm">{customer.visits}</td><td className="px-5 py-4 text-sm font-semibold">{money(customer.totalSpent)}</td><td className={`px-5 py-4 text-sm font-bold ${customer.creditBalance > 0 ? 'text-amber-700' : 'text-stone-400'}`}>{money(customer.creditBalance)}</td><td className="px-5 py-4 text-sm text-stone-500">{customer.lastPurchaseAt ? new Date(customer.lastPurchaseAt).toLocaleDateString() : '—'}</td><td className="px-6 py-4"><div className="flex justify-end gap-2">{customer.creditBalance > 0 && customer.isActive && <button onClick={() => { setPaymentCustomer(customer); setError(''); setNotice(''); }} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800"><Banknote size={15} />Collect</button>}<button disabled={!canChangeStatus || busy} onClick={() => void toggle(customer)} className={`rounded-full px-2.5 py-1 text-xs font-bold ${customer.isActive ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>{customer.isActive ? 'Active' : 'Inactive'}</button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="p-8 text-center text-sm text-stone-500">No customers match this view.</p>}</div></section>
  </div>;
}

function Summary({ label, value, orange = false, credit = false }: { label: string; value: string; orange?: boolean; credit?: boolean }) {
  return <div className={`rounded-2xl border p-5 ${credit ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white'}`}><p className={`text-xs font-bold uppercase ${credit ? 'text-amber-700' : 'text-stone-400'}`}>{label}</p><p className={`mt-2 text-2xl font-extrabold ${credit ? 'text-amber-800' : orange ? 'text-brand-orange-600' : ''}`}>{value}</p></div>;
}
