import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormField({ label, id, ...props }: FormFieldProps) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-semibold text-brand-charcoal-900">{label}</span>
      <input id={id} className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-sm text-brand-charcoal-950 shadow-sm transition placeholder:text-stone-400 focus:border-brand-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10" {...props} />
    </label>
  );
}

