import { useState } from 'react';
import { Building2, CreditCard, LockKeyhole, UserRound } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';
import { useAuth } from '../features/auth/AuthContext';
import { SubscriptionPage } from './SubscriptionPage';
import { BusinessProfileForm } from '../components/BusinessProfileForm';

type SettingsTab = 'workspace' | 'account' | 'subscription';

export function SettingsPage() {
  const { identity } = useAuth();
  const canManageSubscription = identity?.user.role === 'owner' || identity?.user.role === 'admin';
  const [tab, setTab] = useState<SettingsTab>('workspace');
  const tabs = [
    { id: 'workspace' as const, label: 'Workspace', icon: Building2 },
    { id: 'account' as const, label: 'My account', icon: UserRound },
    ...(canManageSubscription ? [{ id: 'subscription' as const, label: 'Subscription', icon: CreditCard }] : []),
  ];

  return <div className="mx-auto max-w-[1200px]">
    <PageHeading eyebrow="Administration" title="Settings" description="Manage your workspace, account, and SmartManager subscription in one place." />
    <div className="mt-7 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="self-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Settings</p>{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${tab === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><Icon size={17} />{label}</button>)}</aside>
      <div className="min-w-0">
        {tab === 'workspace' && <BusinessProfileForm />}
        {tab === 'account' && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-700"><UserRound size={21} /></span><div><h2 className="font-bold text-slate-950">Account and security</h2><p className="mt-1 text-xs text-slate-500">Your signed-in identity and access level.</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Name</p><p className="mt-2 font-semibold text-slate-900">{identity?.user.firstName} {identity?.user.lastName}</p></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</p><p className="mt-2 break-all font-semibold text-slate-900">{identity?.user.email}</p></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Role</p><p className="mt-2 capitalize font-semibold text-slate-900">{identity?.user.role}</p></div><div className="rounded-xl border border-slate-200 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><LockKeyhole size={14} />Security</p><p className="mt-2 text-sm font-semibold text-emerald-700">Authenticated session active</p></div></div></section>}
        {tab === 'subscription' && canManageSubscription && <SubscriptionPage embedded />}
      </div>
    </div>
  </div>;
}
