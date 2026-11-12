import { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';
import { getApiErrorMessage } from '../services/apiClient';
import { getSubscription } from '../services/subscriptionService';
import type { Subscription } from '../types/api';

export function SubscriptionPage({ embedded = false }: { embedded?: boolean }) {
  const [businessName, setBusinessName] = useState(''); const [subscription, setSubscription] = useState<Subscription | null>(null); const [error, setError] = useState('');
  useEffect(() => { void getSubscription().then((result) => { setBusinessName(result.businessName); setSubscription(result.subscription ?? null); }).catch((requestError) => setError(getApiErrorMessage(requestError, 'Subscription details could not be loaded.'))); }, []);
  const fallbackEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); const periodEnd = subscription ? new Date(subscription.currentPeriodEnd) : fallbackEnd; const days = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / 86_400_000));
  return <div className={embedded ? '' : 'mx-auto max-w-[1100px]'}>{!embedded && <PageHeading eyebrow="Workspace administration" title="Subscription" description="Review the plan and billing state for your SmartManager workspace." />}
    {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <section className={`${embedded ? '' : 'mt-7'} overflow-hidden rounded-3xl bg-brand-charcoal-950 p-7 text-white shadow-xl sm:p-9`}><div className="flex flex-wrap items-start justify-between gap-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange-400">{businessName || 'Workspace'}</p><h2 className="mt-3 text-3xl font-extrabold capitalize">{subscription?.plan ?? 'Trial'} plan</h2><p className="mt-2 text-sm text-stone-300">Status: <span className="font-bold capitalize text-white">{(subscription?.status ?? 'trialing').replace('_', ' ')}</span></p></div><span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold">{days} days remaining</span></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-white/6 p-4"><CreditCard className="text-brand-orange-400" /><p className="mt-3 text-xs text-stone-400">Current period ends</p><p className="mt-1 font-bold">{periodEnd.toLocaleDateString()}</p></div><div className="rounded-2xl bg-white/6 p-4"><ShieldCheck className="text-brand-orange-400" /><p className="mt-3 text-xs text-stone-400">Workspace access</p><p className="mt-1 font-bold">{subscription?.status === 'cancelled' ? 'Ending' : 'Enabled'}</p></div><div className="rounded-2xl bg-white/6 p-4"><CheckCircle2 className="text-brand-orange-400" /><p className="mt-3 text-xs text-stone-400">Billing management</p><p className="mt-1 font-bold">Platform administered</p></div></div></section>
    <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6"><h2 className="font-bold">Need a plan change?</h2><p className="mt-2 text-sm leading-6 text-stone-500">Plan changes and renewals are currently handled by the SmartManager platform administrator. Online payment processing will be connected in a later phase.</p></div>
  </div>;
}
