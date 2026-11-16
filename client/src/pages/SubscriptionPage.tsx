import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, CreditCard, Headphones, ShieldCheck, Sparkles } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';
import { getApiErrorMessage } from '../services/apiClient';
import { getSubscription } from '../services/subscriptionService';
import type { Subscription } from '../types/api';

const dayMs = 86_400_000;
const dateLabel = (date: Date) => date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

export function SubscriptionPage({ embedded = false }: { embedded?: boolean }) {
  const [businessName, setBusinessName] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getSubscription().then((result) => {
      if (!active) return;
      setBusinessName(result.businessName);
      setSubscription(result.subscription ?? null);
    }).catch((requestError) => {
      if (active) setError(getApiErrorMessage(requestError, 'Subscription details could not be loaded.'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const periodEnd = useMemo(() => subscription ? new Date(subscription.currentPeriodEnd) : null, [subscription]);
  const daysRemaining = periodEnd ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / dayMs)) : null;
  const status = subscription?.status ?? 'trialing';
  const isPastDue = status === 'past_due' || (daysRemaining === 0 && status === 'active');
  const statusLabel = isPastDue ? 'Payment due' : status === 'cancelled' ? 'Ends at period close' : status.replace('_', ' ');
  const statusTone = isPastDue ? 'bg-amber-100 text-amber-800' : status === 'cancelled' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800';

  return <div className={embedded ? '' : 'mx-auto max-w-[1100px]'}>
    {!embedded && <PageHeading eyebrow="Workspace administration" title="Billing & subscription" description="Subscription" />}
    {error && <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}

    <section className={`${embedded ? '' : 'mt-7'} overflow-hidden rounded-3xl bg-brand-charcoal-950 text-white shadow-xl`}>
      <div className="relative overflow-hidden p-7 sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-20 size-72 rounded-full bg-brand-orange-500/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-orange-400">{businessName || 'Workspace billing'}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3"><h2 className="text-3xl font-extrabold capitalize">{loading ? 'Loading plan…' : `${subscription?.plan ?? 'Trial'} plan`}</h2><span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusTone}`}>{statusLabel}</span></div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-300">{status === 'trialing' ? 'Your workspace is on a trial. Contact the platform team when you are ready to choose a paid plan.' : isPastDue ? 'Your billing period has ended. Contact the platform team to renew and keep uninterrupted access.' : status === 'cancelled' ? 'Your plan is set to end at the close of the current billing period.' : 'Your subscription is active. Your workspace access is covered through the date below.'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right"><p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{status === 'trialing' ? 'Trial time left' : 'Coverage remaining'}</p><p className="mt-1 text-3xl font-black">{loading ? '—' : `${daysRemaining ?? 0}`} <span className="text-sm font-semibold text-stone-400">days</span></p></div>
        </div>
        <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><CalendarClock className="text-brand-orange-400" size={20} /><p className="mt-3 text-xs text-stone-400">{status === 'trialing' ? 'Trial ends' : 'Current period ends'}</p><p className="mt-1 font-bold">{periodEnd ? dateLabel(periodEnd) : loading ? 'Loading…' : 'Contact support'}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><ShieldCheck className="text-brand-orange-400" size={20} /><p className="mt-3 text-xs text-stone-400">Workspace access</p><p className="mt-1 font-bold">{isPastDue ? 'Renewal needed' : 'Available'}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><CreditCard className="text-brand-orange-400" size={20} /><p className="mt-3 text-xs text-stone-400">Billing cadence</p><p className="mt-1 font-bold capitalize">{status === 'trialing' ? 'Trial' : subscription?.billingInterval ?? 'Monthly'}</p></div>
        </div>
      </div>
    </section>

    <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-brand-orange-600"><Sparkles size={19} /></span><div><h2 className="font-bold text-brand-charcoal-950">Plan management</h2><p className="mt-1 text-sm leading-6 text-stone-500">Plan changes, invoices, and renewals are handled by the SmartManager billing team. Payments are recorded after they are received through an agreed channel.</p></div></div>
        <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-stone-800"><CheckCircle2 size={17} className="text-emerald-600" />Monthly and yearly billing</div><p className="mt-1.5 pl-6 text-xs leading-5 text-stone-500">Choose either cadence when arranging a renewal. A receipt and updated coverage are added after the platform team confirms payment.</p></div>
      </section>
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-7">
        <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Headphones size={19} /></span><h2 className="mt-4 font-bold text-brand-charcoal-950">Need billing help?</h2><p className="mt-2 text-sm leading-6 text-stone-500">Contact your SmartManager administrator to change plans, request an invoice, or confirm a payment. Include your business name and transaction reference.</p>
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-xs font-medium text-stone-600"><CreditCard size={15} className="text-brand-orange-600" />No online charge will be made from this page.</div>
      </section>
    </div>
  </div>;
}
