import { Printer, X } from 'lucide-react';
import type { PlatformPayment } from '../types/api';

const money = (amount: number, currency: string) => `${amount.toLocaleString()} ${currency}`;
const date = (value: string) => new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
const titleCase = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export function PlatformPaymentReceipt({ payment, onClose }: { payment: PlatformPayment; onClose: () => void }) {
  const receiptNumber = `PAY-${payment.id.slice(-8).toUpperCase()}`;
  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 p-4 print:static print:bg-white print:p-0" role="dialog" aria-modal="true" aria-labelledby="platform-payment-receipt-title">
    <div className="mx-auto mb-4 flex max-w-[760px] justify-end gap-2 print:hidden">
      <button onClick={onClose} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800"><X size={16}/>Close</button>
      <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"><Printer size={16}/>Print receipt</button>
    </div>
    <article id="platform-payment-receipt" className="mx-auto min-h-[760px] max-w-[760px] bg-white p-8 text-slate-900 shadow-2xl sm:p-12 print:min-h-0 print:max-w-none print:p-0 print:shadow-none">
      <header className="flex items-start justify-between gap-6 border-b-4 border-slate-900 pb-6">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">SmartManager · Platform billing</p><h1 id="platform-payment-receipt-title" className="mt-3 text-3xl font-black">Payment receipt</h1><p className="mt-2 text-sm text-slate-500">Official record of subscription payment received</p></div>
        <div className="text-right"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Receipt number</p><p className="mt-1 font-mono text-lg font-black">{receiptNumber}</p><p className="mt-2 text-xs text-slate-500">Issued {new Date().toLocaleDateString()}</p></div>
      </header>
      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Received from</p><h2 className="mt-2 text-lg font-extrabold">{payment.businessName}</h2><p className="mt-1 text-sm text-slate-500">{payment.businessSlug}</p></div>
        <div className="sm:text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment date</p><p className="mt-2 text-lg font-bold">{date(payment.paidAt)}</p><p className="mt-1 text-sm text-slate-500">Recorded by {payment.recordedByName}</p></div>
      </section>
      <section className="mt-8 overflow-hidden rounded-xl border border-slate-200">
        <div className="flex items-center justify-between bg-slate-50 px-5 py-4"><span className="text-sm font-semibold text-slate-600">Amount received</span><strong className="text-2xl font-black">{money(payment.amount, payment.currency)}</strong></div>
        <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold text-slate-500">Payment method</dt><dd className="mt-1 font-bold">{titleCase(payment.method)}</dd></div>
          <div><dt className="text-xs font-semibold text-slate-500">Transaction reference</dt><dd className="mt-1 font-bold">{payment.reference || '—'}</dd></div>
          <div><dt className="text-xs font-semibold text-slate-500">Subscription plan</dt><dd className="mt-1 font-bold">{titleCase(payment.plan)} · {titleCase(payment.billingInterval ?? 'monthly')}</dd></div>
          <div><dt className="text-xs font-semibold text-slate-500">Coverage through</dt><dd className="mt-1 font-bold">{date(payment.periodEnd)}</dd></div>
        </dl>
      </section>
      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-900">Payment received in full</p><p className="mt-1 text-xs text-emerald-800">This receipt confirms the payment recorded for the subscription period shown above.</p></div>
      <footer className="mt-14 border-t border-slate-200 pt-4 text-center text-xs text-slate-500"><p>Thank you for your payment.</p><p className="mt-1">SmartManager Platform Administration</p></footer>
    </article>
  </div>;
}
