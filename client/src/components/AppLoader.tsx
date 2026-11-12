import { Logo } from './Logo';

export function AppLoader({ message = 'Preparing your workspace' }: { message?: string }) {
  return <div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-brand-charcoal-950 text-white">
    <div className="absolute -left-40 top-1/3 size-[32rem] rounded-full bg-brand-orange-500/10 blur-3xl" />
    <div className="absolute -right-40 -top-40 size-[30rem] rounded-full bg-orange-400/10 blur-3xl" />
    <div className="relative flex w-full max-w-sm flex-col items-center px-8 text-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur"><Logo inverse /></div>
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-brand-orange-400">Smart business operations</p>
      <p className="mt-3 text-sm text-stone-400">{message}</p>
      <div className="mt-7 h-1 w-48 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-[loader_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-brand-orange-600 to-brand-orange-400" /></div>
      <p className="mt-10 text-[10px] uppercase tracking-[0.18em] text-stone-600">Secure · Reliable · Multi-tenant</p>
    </div>
  </div>;
}
