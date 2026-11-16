import { LoaderCircle } from 'lucide-react';

export function DataLoading({ label = 'Loading data…', compact = false }: { label?: string; compact?: boolean }) {
  return <div role="status" aria-live="polite" className={`flex items-center justify-center gap-2 text-sm font-medium text-slate-500 ${compact ? 'py-5' : 'min-h-40 py-10'}`}><LoaderCircle size={17} className="animate-spin text-brand-orange-500"/><span>{label}</span></div>;
}
