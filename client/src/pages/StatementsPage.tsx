import { useCallback, useEffect, useState } from 'react';
import { ArrowDownToLine, FileText, Search, Users, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageHeading } from '../components/PageHeading';
import { getApiErrorMessage } from '../services/apiClient';
import { getCustomerStatement, getCustomers } from '../services/customerService';
import { getSupplierStatement, getSuppliers } from '../services/purchasingService';
import type { AccountStatement, Customer, Supplier } from '../types/api';

type StatementType = 'customers' | 'suppliers';
const money = (value: number) => `${value.toLocaleString()} RWF`;

export function StatementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState<StatementType>(searchParams.get('party') === 'supplier' ? 'suppliers' : 'customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('id') ?? '');
  const [statement, setStatement] = useState<AccountStatement | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const entries = type === 'customers' ? customers : suppliers;
  const filtered = entries.filter((entry) => `${entry.name} ${entry.phone} ${entry.email}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    void Promise.allSettled([getCustomers(), getSuppliers()]).then(([customerResult, supplierResult]) => {
      if (customerResult.status === 'fulfilled') setCustomers(customerResult.value);
      if (supplierResult.status === 'fulfilled') setSuppliers(supplierResult.value);
      const failure = [customerResult, supplierResult].find((result) => result.status === 'rejected');
      if (failure?.status === 'rejected') setError(getApiErrorMessage(failure.reason, 'Statement accounts could not be loaded.'));
    });
  }, []);

  const loadStatement = useCallback(async (partyType: StatementType, id: string) => {
    if (!id) { setStatement(null); return; }
    setLoading(true); setError('');
    try { setStatement(partyType === 'customers' ? await getCustomerStatement(id) : await getSupplierStatement(id)); }
    catch (requestError) { setStatement(null); setError(getApiErrorMessage(requestError, 'Statement could not be loaded.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (selectedId) void loadStatement(type, selectedId); }, [selectedId, type, loadStatement]);
  const chooseType = (next: StatementType) => { setType(next); setSelectedId(''); setStatement(null); setSearchParams({ party: next === 'customers' ? 'customer' : 'supplier' }); };
  const chooseAccount = (id: string) => { setSelectedId(id); setSearchParams(id ? { party: type === 'customers' ? 'customer' : 'supplier', id } : { party: type === 'customers' ? 'customer' : 'supplier' }); };

  return <div className="mx-auto max-w-[1450px]"><PageHeading eyebrow="Financial control" title="Account statements" description="Review customer balances and supplier payables, with a dated history of every sale, order, and payment." action={statement ? <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"><ArrowDownToLine size={16} />Print statement</button> : undefined} />
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center gap-3"><div className="flex rounded-xl bg-slate-100 p-1">{(['customers', 'suppliers'] as const).map((item) => <button key={item} onClick={() => chooseType(item)} className={`rounded-lg px-4 py-2.5 text-sm font-bold capitalize ${type === item ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><Users className="mr-2 inline" size={15} />{item}</button>)}</div><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${type}`} className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm" /></div><select aria-label={`Select ${type.slice(0, -1)}`} value={selectedId} onChange={(event) => chooseAccount(event.target.value)} className="h-11 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"><option value="">Choose {type === 'customers' ? 'a customer' : 'a supplier'}</option>{filtered.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select>{selectedId && <button onClick={() => chooseAccount('')} aria-label="Clear selected account" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={17} /></button>}</div></section>
    {!statement && <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-orange-50 text-brand-orange-600"><FileText size={22} /></span><h2 className="mt-4 text-base font-bold text-slate-900">{loading ? 'Loading statement…' : 'Select an account to view its statement'}</h2><p className="mt-1 text-sm text-slate-500">Payment dates, methods, references, and outstanding balances will appear here.</p></div>}
    {statement && <div id="account-statement-print" className="mt-5 space-y-5"><header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange-600">{type === 'customers' ? 'Receivables statement' : 'Payables statement'}</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{statement.party.name}</h2><p className="mt-1 text-sm text-slate-500">{statement.party.phone || 'No phone'}{statement.party.email ? ` · ${statement.party.email}` : ''}</p></div><div className="text-right text-xs text-slate-500"><p>Generated</p><p className="mt-1 font-semibold text-slate-700">{new Date().toLocaleString()}</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Summary label={type === 'customers' ? 'Sales total' : 'Received orders'} value={statement.total} /><Summary label="Total paid" value={statement.paid} /><Summary label="Balance due" value={statement.balanceDue} due /></div></header>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h3 className="font-bold text-slate-950">Transaction ledger</h3><p className="mt-1 text-xs text-slate-500">{statement.transactions.length} records · newest first</p></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Date / reference</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Balance</th><th className="px-5 py-3">Payment activity</th></tr></thead><tbody className="divide-y divide-slate-100">{statement.transactions.map((transaction) => <tr key={transaction.id} className="align-top"><td className="px-5 py-4"><p className="text-sm font-bold text-slate-900">{transaction.reference}</p><p className="mt-1 text-xs text-slate-500">{new Date(transaction.date).toLocaleDateString()}</p></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${transaction.balance > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>{transaction.status ?? (transaction.balance > 0 ? 'outstanding' : 'settled')}</span></td><td className="px-4 py-4 text-right text-sm">{money(transaction.total)}</td><td className="px-4 py-4 text-right text-sm font-semibold">{money(transaction.paid)}</td><td className={`px-4 py-4 text-right text-sm font-bold ${transaction.balance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>{money(transaction.balance)}</td><td className="px-5 py-4">{transaction.payments.length ? <div className="space-y-2">{transaction.payments.map((payment, index) => <div key={`${transaction.id}-${index}`} className="flex justify-between gap-3 text-xs"><span className="text-slate-500">{new Date(payment.date).toLocaleDateString()} · {payment.method.replaceAll('_', ' ')}{payment.reference ? ` · ${payment.reference}` : ''}</span><strong className="whitespace-nowrap text-slate-800">{money(payment.amount)}</strong></div>)}</div> : <span className="text-xs text-slate-400">No payments recorded</span>}</td></tr>)}</tbody></table>{statement.transactions.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No statement activity yet.</p>}</div></section></div>}
  </div>;
}

function Summary({ label, value, due = false }: { label: string; value: number; due?: boolean }) { return <div className={`rounded-xl border p-4 ${due && value > 0 ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-2 text-xl font-black ${due && value > 0 ? 'text-amber-800' : 'text-slate-950'}`}>{money(value)}</p></div>; }
