import { Outlet } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function AuthLayout() {
  return (
    <main className="smartmanager-theme grid min-h-screen bg-[#f5f7fb] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-brand-charcoal-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-32 top-1/3 size-96 rounded-full bg-brand-orange-500/15 blur-3xl" />
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-orange-500/20 blur-3xl" />
        <Logo inverse />
        <div className="relative my-auto max-w-xl"><span className="block h-1 w-14 rounded-full bg-brand-orange-500" /><h1 className="mt-7 text-5xl font-black leading-[1.08] tracking-tight">Manage your business with clarity.</h1><p className="mt-5 max-w-md text-base leading-7 text-stone-400">Operations, finance, and reporting in one secure workspace.</p></div>
        <p className="relative text-xs text-stone-600">© {new Date().getFullYear()} SmartManager</p>
      </section>
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden p-5 sm:p-10"><div className="absolute right-8 top-8 hidden text-xs font-semibold text-slate-400 sm:block">SmartManager</div>
        <div className="relative w-full max-w-[500px] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10 sm:p-10">
          <div className="mb-10 lg:hidden"><Logo /></div>
          <Outlet />
        </div>
      </section>
    </main>
  );
}

