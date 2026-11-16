import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, Building2, CircleOff, MapPin, Plus, Search, Store } from 'lucide-react';
import { FormField } from '../components/FormField';
import { PageHeading } from '../components/PageHeading';
import { createBranch, getBranches, setBranchStatus } from '../services/tenantAdminService';
import { getApiErrorMessage } from '../services/apiClient';
import type { TenantBranch } from '../types/api';

export function BranchesPage() {
  const [items, setItems] = useState<TenantBranch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setError(''); try { setItems(await getBranches()); } catch (e) { setError(getApiErrorMessage(e, 'Branches could not be loaded.')); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const active = items.filter((branch) => branch.isActive).length;
  const visible = useMemo(() => items.filter((branch) => (filter === 'all' || branch.isActive === (filter === 'active')) && `${branch.name} ${branch.code}`.toLowerCase().includes(query.toLowerCase())), [items, filter, query]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const data = new FormData(event.currentTarget); try { await createBranch({ name: String(data.get('name')).trim(), code: String(data.get('code')).trim() }); setShowForm(false); await load(); } catch (e) { setError(getApiErrorMessage(e, 'Branch could not be created.')); } finally { setBusy(false); } };
  const toggle = async (branch: TenantBranch) => { setError(''); try { await setBranchStatus(branch.id, !branch.isActive); await load(); } catch (e) { setError(getApiErrorMessage(e, 'Branch status could not be changed.')); } };
  return <div className="mx-auto max-w-[1200px]">
    <PageHeading eyebrow="Tenant administration" title="Branches" description="A clear view of every location in your business, with access and operating status in one place." action={<button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-brand-charcoal-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700"><Plus size={17} />Add branch</button>} />
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Branch summary">
      <Metric icon={Building2} label="Total locations" value={items.length} detail="Across this workspace" />
      <Metric icon={Activity} label="Operating" value={active} detail="Active locations" tone="green" />
      <Metric icon={CircleOff} label="Paused" value={items.length - active} detail="Access currently disabled" tone="slate" />
    </section>
    {showForm && <form onSubmit={(event) => void submit(event)} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-orange-600">New location</p><h2 className="mt-1 text-lg font-bold text-slate-950">Add a branch</h2><p className="mt-1 text-sm text-slate-500">Give this location a recognizable name and unique short code.</p></div><div className="grid gap-4 sm:grid-cols-[1fr_220px_auto] sm:items-end"><FormField id="branch-name" name="name" label="Branch name" required /><FormField id="branch-code" name="code" label="Branch code" placeholder="e.g. KGL-02" required /><div className="flex gap-2"><button type="button" onClick={() => setShowForm(false)} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">Cancel</button><button disabled={busy} className="h-12 rounded-xl bg-brand-orange-500 px-5 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Create branch'}</button></div></div></form>}
    <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-4 sm:px-5"><div><h2 className="font-bold text-slate-950">All locations</h2><p className="mt-0.5 text-xs text-slate-500">Manage where your team operates.</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><label className="relative min-w-[200px] flex-1 sm:flex-none"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search branches" placeholder="Search name or code" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"/></label><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter branches" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
      {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading locations…</div> : visible.length === 0 ? <div className="p-10 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-50 text-slate-400"><Store size={22}/></span><h3 className="mt-3 font-bold text-slate-800">{items.length ? 'No locations match your search' : 'No branches yet'}</h3><p className="mt-1 text-sm text-slate-500">{items.length ? 'Try another name or status filter.' : 'Add your first branch to organize operations across locations.'}</p></div> : <div className="divide-y divide-slate-100">{visible.map((branch) => <article key={branch.id} className="flex flex-wrap items-center gap-4 px-4 py-4 transition hover:bg-slate-50/70 sm:px-5"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${branch.isActive ? 'bg-orange-50 text-brand-orange-600' : 'bg-slate-100 text-slate-500'}`}><Building2 size={20}/></span><div className="min-w-[150px] flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{branch.name}</h3>{branch.isPrimary && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">Primary</span>}</div><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={13}/>Location code <span className="font-semibold text-slate-700">{branch.code}</span></p></div><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${branch.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><span className={`size-1.5 rounded-full ${branch.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}/>{branch.isActive ? 'Active' : 'Inactive'}</span><button disabled={branch.isPrimary} onClick={() => void toggle(branch)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40">{branch.isActive ? 'Deactivate' : 'Reactivate'}</button></article>)}</div>}
      {!loading && visible.length > 0 && <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">Showing {visible.length} of {items.length} locations</div>}
    </section>
  </div>;
}

function Metric({ icon: Icon, label, value, detail, tone = 'orange' }: { icon: typeof Building2; label: string; value: number; detail: string; tone?: 'orange' | 'green' | 'slate' }) {
  const colors = { orange: 'bg-orange-50 text-orange-600', green: 'bg-emerald-50 text-emerald-600', slate: 'bg-slate-100 text-slate-500' };
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{label}</span><span className={`grid size-9 place-items-center rounded-xl ${colors[tone]}`}><Icon size={17}/></span></div><div className="mt-3 flex items-baseline gap-2"><span className="text-2xl font-black tracking-tight text-slate-950">{value}</span><span className="text-xs text-slate-400">{detail}</span></div></article>;
}
