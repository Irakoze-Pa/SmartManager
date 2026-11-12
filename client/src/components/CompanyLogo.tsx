import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

export function CompanyLogo({ name, logoUrl, className = 'size-10' }: { name: string; logoUrl?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [logoUrl]);
  if (logoUrl && !failed) return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white ${className}`}><img src={logoUrl} alt={`${name} logo`} onError={() => setFailed(true)} className="h-full w-full object-contain p-1" /></span>;
  return <span aria-label={`${name} logo placeholder`} className={`grid shrink-0 place-items-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-brand-orange-500 ${className}`}><Building2 size={18} aria-hidden="true" /></span>;
}
