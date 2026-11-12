import { Boxes } from 'lucide-react';

interface LogoProps {
  compact?: boolean;
  inverse?: boolean;
}

export function Logo({ compact = false, inverse = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-orange-500 to-brand-orange-600 text-white shadow-lg shadow-orange-950/20">
        <Boxes size={21} strokeWidth={2.3} aria-hidden="true" />
        <span className="absolute right-0 top-0 size-2.5 rounded-bl-lg bg-white/80" />
      </span>
      {!compact && (
        <span className={`leading-none ${inverse ? 'text-white' : 'text-brand-charcoal-950'}`}>
          <span className="block text-[17px] font-extrabold tracking-tight">SmartManager</span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.3em] text-brand-orange-500">Business OS</span>
        </span>
      )}
    </div>
  );
}

