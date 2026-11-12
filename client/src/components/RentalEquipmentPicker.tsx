import { Check, ChevronDown, PackageCheck, TriangleAlert } from 'lucide-react';
import type { RentalEquipment } from '../services/rentalService';

const requirements = [
  { label: 'Joint pins / Jonction', matches: (name: string) => name.includes('joint') || name.includes('jonction') },
  { label: 'Scaffold boards / Imbaho', matches: (name: string) => name.includes('scaffold board') || name.includes('imbaho') },
  { label: 'Base jacks / Ibirenge', matches: (name: string) => name.includes('base jack') || name.includes('ibirenge') },
  { label: 'Cross braces / Imikandara', matches: (name: string) => name.includes('cross brace') || name.includes('imikandara') },
];

export function getMissingHFrameAccessories(equipment: RentalEquipment[], quantities: Record<string, number>) {
  const hasHFrame = equipment.some((item) => item.itemType !== 'accessory' && item.name.toLowerCase().includes('h-frame') && (quantities[item._id] ?? 0) > 0);
  if (!hasHFrame) return [];
  return requirements.filter((requirement) => !equipment.some((item) => item.itemType === 'accessory' && requirement.matches(item.name.toLowerCase()) && (quantities[item._id] ?? 0) > 0)).map((requirement) => requirement.label);
}

export function RentalEquipmentPicker({ equipment, quantities, setQuantities }: { equipment: RentalEquipment[]; quantities: Record<string, number>; setQuantities: (value: Record<string, number>) => void }) {
  const main = equipment.filter((item) => item.itemType !== 'accessory' && item.availableQuantity > 0);
  const accessories = equipment.filter((item) => item.itemType === 'accessory' && item.availableQuantity > 0);
  const hasHFrame = main.some((item) => item.name.toLowerCase().includes('h-frame') && (quantities[item._id] ?? 0) > 0);
  const visibleAccessories = hasHFrame ? accessories.filter((item) => !item.compatibleWith || item.compatibleWith.toLowerCase().includes('h-frame')) : [];
  const missing = getMissingHFrameAccessories(equipment, quantities);
  const selected = equipment.filter((item) => (quantities[item._id] ?? 0) > 0);
  const estimatedDaily = selected.reduce((sum, item) => sum + item.dailyRate * (quantities[item._id] ?? 0), 0);
  const change = (item: RentalEquipment, quantity: number) => setQuantities({ ...quantities, [item._id]: Math.min(item.availableQuantity, Math.max(0, quantity || 0)) });

  return <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
      <div><h4 className="font-black">Equipment dispatch schedule</h4><p className="mt-1 text-xs text-stone-500">Select main equipment first. H-frame accessories open automatically.</p></div>
      <div className="flex items-center gap-5 text-right"><div><p className="text-[10px] font-bold uppercase text-stone-600">Selected lines</p><p className="font-black">{selected.length}</p></div><div><p className="text-[10px] font-bold uppercase text-stone-600">Daily hire</p><p className="font-black text-brand-orange-500">{estimatedDaily.toLocaleString()} RWF</p></div></div>
    </header>

    <EquipmentTable title="Main rental equipment" subtitle="Click a row to select one unit, then adjust the quantity." items={main} quantities={quantities} onChange={change} />

    {hasHFrame ? <section className="border-t border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-500/5 px-5 py-4"><div className="flex items-center gap-3"><ChevronDown size={18} className="text-blue-400"/><div><h5 className="text-sm font-black text-blue-300">H-frame accessories</h5><p className="text-xs text-stone-500">Record every component leaving the warehouse.</p></div></div><KitStatus missing={missing}/></div>
      {visibleAccessories.length ? <EquipmentTable title="" subtitle="" items={visibleAccessories} quantities={quantities} onChange={change} accessory /> : <div className="m-5 border-l-4 border-amber-500 bg-amber-500/5 p-4 text-sm text-amber-300"><strong>No H-frame accessories are registered.</strong><p className="mt-1 text-xs">Register Jonction, Imbaho, Ibirenge and Imikandara in Equipment Inventory before dispatch.</p></div>}
      {missing.length > 0 && <div className="flex gap-3 border-t border-amber-500/20 bg-amber-500/5 px-5 py-4"><TriangleAlert size={18} className="shrink-0 text-amber-400"/><div><p className="text-sm font-bold text-amber-300">Required components missing</p><p className="mt-1 text-xs text-stone-400">{missing.join(' · ')}</p></div></div>}
    </section> : accessories.length > 0 && <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4 text-sm text-stone-500"><PackageCheck size={18}/><span>Select an H-frame row to open its accessory schedule.</span></div>}

    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-black/20 px-5 py-4"><div><p className="text-xs font-bold uppercase text-stone-600">Dispatch readiness</p><p className="mt-1 text-sm font-semibold">{selected.length ? `${selected.length} line item${selected.length === 1 ? '' : 's'} selected` : 'No equipment selected'}</p></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${selected.length && !missing.length ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{selected.length && !missing.length ? <Check size={14}/> : <TriangleAlert size={14}/>} {selected.length && !missing.length ? 'Ready for pricing' : 'Selection incomplete'}</span></footer>
  </div>;
}

function EquipmentTable({ title, subtitle, items, quantities, onChange, accessory = false }: { title: string; subtitle: string; items: RentalEquipment[]; quantities: Record<string, number>; onChange: (item: RentalEquipment, quantity: number) => void; accessory?: boolean }) {
  return <section>{title && <div className="px-5 pb-3 pt-5"><h5 className="text-xs font-black uppercase tracking-wider text-stone-400">{title}</h5>{subtitle && <p className="mt-1 text-xs text-stone-600">{subtitle}</p>}</div>}<div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-y border-white/5 bg-black/20 text-[10px] uppercase tracking-wider text-stone-600"><tr><th className="px-5 py-3">{accessory ? 'Accessory / component' : 'Equipment'}</th><th className="px-4 py-3">Stock code</th><th className="px-4 py-3 text-right">Available</th><th className="px-4 py-3 text-right">Rate / day</th><th className="px-5 py-3 text-right">Rental quantity</th></tr></thead><tbody className="divide-y divide-white/5">{items.map((item) => { const quantity = quantities[item._id] ?? 0; const required = accessory && requirements.some((requirement) => requirement.matches(item.name.toLowerCase())); return <tr key={item._id} onClick={(event) => { if (!(event.target instanceof HTMLInputElement) && quantity === 0) onChange(item, 1); }} className={`cursor-pointer transition hover:bg-white/[0.03] ${quantity > 0 ? 'bg-orange-500/[0.06]' : ''}`}><td className="px-5 py-3"><div className="flex items-center gap-3"><span className={`size-2 rounded-full ${quantity > 0 ? 'bg-brand-orange-500' : 'bg-stone-700'}`}/><div><p className="font-bold">{item.name}</p><p className="mt-0.5 text-xs text-stone-600">{item.compatibleWith || item.category}{required && <span className="ml-2 font-bold text-amber-400">Required</span>}</p></div></div></td><td className="px-4 py-3 font-mono text-xs text-stone-500">{item.code}</td><td className="px-4 py-3 text-right"><strong>{item.availableQuantity}</strong> <span className="text-xs text-stone-600">{item.unit}</span></td><td className="px-4 py-3 text-right">{item.dailyRate.toLocaleString()} RWF</td><td className="px-5 py-3 text-right"><input aria-label={`${item.name} rental quantity`} type="number" min="0" max={item.availableQuantity} value={quantity} onChange={(event) => onChange(item, Number(event.target.value))} className="h-10 w-24 rounded-lg border border-white/10 bg-black/30 px-3 text-right font-bold outline-none focus:border-brand-orange-500"/></td></tr>; })}</tbody></table></div>{!items.length && <p className="px-5 py-8 text-center text-sm text-stone-500">No available equipment in this section.</p>}</section>;
}

function KitStatus({ missing }: { missing: string[] }) {
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${missing.length ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{missing.length ? <TriangleAlert size={14}/> : <Check size={14}/>} {missing.length ? `${missing.length} required missing` : 'Required kit complete'}</span>;
}
