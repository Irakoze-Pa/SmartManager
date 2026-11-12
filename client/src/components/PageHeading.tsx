import type { ReactNode } from 'react';

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading flex flex-wrap items-end justify-between gap-5 border-b border-slate-200 pb-6"><div className="max-w-3xl"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-orange-600"><span className="h-px w-6 bg-brand-orange-500" />{eyebrow}</p><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>{action && <div className="shrink-0">{action}</div>}</div>;
}

