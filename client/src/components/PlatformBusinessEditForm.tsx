import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { BusinessIndustry, PlatformBusiness } from '../types/api';

const sectors: Array<[BusinessIndustry, string]> = [
  ['supermarket', 'Supermarket & Grocery'], ['retail', 'Retail & Shops'], ['wholesale', 'Wholesale & Distribution'], ['manufacturing', 'Manufacturing'],
  ['real_estate', 'Real Estate'], ['restaurant', 'Restaurants & Bars'],
  ['logistics', 'Transport & Logistics'], ['school', 'Schools'], ['construction', 'Construction'],
];

export function PlatformBusinessEditForm({ business, busy, onClose, onSubmit }: {
  business: PlatformBusiness;
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-business-title">
    <form onSubmit={onSubmit} className="my-6 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-orange-600">Business profile</p><h2 id="edit-business-title" className="mt-1 text-xl font-extrabold text-slate-950">Edit business</h2><p className="mt-1 text-sm text-slate-500">Update contact, registration, and sector details for {business.name}.</p></div><button type="button" onClick={onClose} aria-label="Close edit form" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></header>
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <Field name="name" label="Business name" required defaultValue={business.name}/>
        <label className="block text-sm font-semibold text-slate-700">Business sector<select name="industry" defaultValue={business.industry} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal">{business.industry === 'building_materials' && <option value="building_materials">Legacy rental workspace</option>}{sectors.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="block text-sm font-semibold text-slate-700">Legal structure<select name="businessType" defaultValue={business.businessType} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal"><option value="sole_trader">Sole trader</option><option value="manufacturer">Manufacturer</option><option value="limited_company">Limited company</option><option value="partnership">Partnership</option><option value="cooperative">Cooperative</option><option value="other">Other</option></select></label>
        <Field name="phone" label="Business phone" type="tel" defaultValue={business.phone ?? ''}/>
        <Field name="email" label="Business email" type="email" defaultValue={business.email ?? ''}/>
        <Field name="address" label="Business address" defaultValue={business.address ?? ''}/>
        <Field name="tin" label="Tax identification number" defaultValue={business.tin ?? ''}/>
        <Field name="registrationNumber" label="Registration number" defaultValue={business.registrationNumber ?? ''}/>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button disabled={busy} className="rounded-xl bg-brand-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Saving changes…' : 'Save business'}</button></footer>
    </form>
  </div>;
}

function Field({ name, label, type = 'text', defaultValue, required = false }: { name: string; label: string; type?: string; defaultValue: string; required?: boolean }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<input name={name} type={type} defaultValue={defaultValue} required={required} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"/></label>;
}
