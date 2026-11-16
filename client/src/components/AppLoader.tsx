import { LoaderCircle } from 'lucide-react';

export function AppLoader({ message = 'Preparing your workspace' }: { message?: string }) {
  return <div role="status" aria-live="polite" className="fixed inset-0 z-[100] grid place-items-center bg-slate-50/95 text-slate-700 backdrop-blur-sm">
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-lg shadow-slate-900/5">
      <LoaderCircle size={20} className="animate-spin text-brand-orange-500" />
      <span className="text-sm font-semibold">{message}</span>
    </div>
  </div>;
}
