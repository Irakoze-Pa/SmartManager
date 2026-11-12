import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Building2, Plus } from 'lucide-react';
import { FormField } from '../components/FormField';
import { PageHeading } from '../components/PageHeading';
import { createBranch, getBranches, setBranchStatus } from '../services/tenantAdminService';
import { getApiErrorMessage } from '../services/apiClient';
import type { TenantBranch } from '../types/api';

export function BranchesPage() {
  const [items, setItems] = useState<TenantBranch[]>([]); const [showForm, setShowForm] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setItems(await getBranches()); } catch (requestError) { setError(getApiErrorMessage(requestError, 'Branches could not be loaded.')); } }, []);
  useEffect(() => { void load(); }, [load]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const data = new FormData(event.currentTarget); try { await createBranch({ name: String(data.get('name')), code: String(data.get('code')) }); setShowForm(false); await load(); } catch (requestError) { setError(getApiErrorMessage(requestError, 'Branch could not be created.')); } finally { setBusy(false); } };
  const toggle = async (branch: TenantBranch) => { setError(''); try { await setBranchStatus(branch.id, !branch.isActive); await load(); } catch (requestError) { setError(getApiErrorMessage(requestError, 'Branch status could not be changed.')); } };
  return <div className="mx-auto max-w-[1200px]"><PageHeading eyebrow="Tenant administration" title="Branches" description={items.length <= 1 ? 'Branch management is optional. Your business currently operates as one shop.' : 'Manage the branches that belong to this business.'} action={<button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-500 px-4 py-3 text-sm font-bold text-white"><Plus size={17} />Add branch</button>} />
    {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {showForm && <form onSubmit={(event) => void submit(event)} className="mt-6 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_220px_auto] sm:items-end"><FormField id="branch-name" name="name" label="Branch name" required /><FormField id="branch-code" name="code" label="Branch code" placeholder="e.g. KGL-02" required /><button disabled={busy} className="h-12 rounded-xl bg-brand-charcoal-900 px-5 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save branch'}</button></form>}
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((branch) => <article key={branch.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-xl bg-orange-50 text-brand-orange-600"><Building2 size={21} /></span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${branch.isActive ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>{branch.isActive ? 'Active' : 'Inactive'}</span></div><h2 className="mt-5 font-bold text-brand-charcoal-950">{branch.name}</h2><p className="mt-1 text-xs text-stone-500">Code: {branch.code}</p><div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">{branch.isPrimary ? <span className="text-xs font-bold text-brand-orange-600">{items.length === 1 ? 'Main shop' : 'Primary branch'}</span> : <span className="text-xs text-stone-400">Additional branch</span>}<button disabled={branch.isPrimary} onClick={() => void toggle(branch)} className="text-xs font-bold text-stone-600 hover:text-brand-orange-600 disabled:cursor-not-allowed disabled:text-stone-300">{branch.isActive ? 'Deactivate' : 'Activate'}</button></div></article>)}</section>
  </div>;
}

