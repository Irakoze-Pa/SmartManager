import { useMemo, useState } from 'react';
import { BookOpen, Boxes, ChevronDown, CircleDollarSign, HelpCircle, Search, ShieldCheck, ShoppingCart } from 'lucide-react';
import { PageHeading } from '../components/PageHeading';

const topics = [
  { icon: ShoppingCart, title: 'Point of sale', description: 'Sales, payments, receipts, and customer checkout.', articles: ['Create and complete a sale', 'Sell products by package or base unit', 'Correct quantities in the cart'] },
  { icon: Boxes, title: 'Inventory', description: 'Stock balances, transfers, purchasing, and adjustments.', articles: ['Receive a purchase order', 'Transfer stock between branches', 'Record a stock correction'] },
  { icon: CircleDollarSign, title: 'Finance and reports', description: 'Expenses, profitability, and business reporting.', articles: ['Understand the finance summary', 'Record an operating expense', 'Review low-stock reporting'] },
  { icon: ShieldCheck, title: 'Administration', description: 'Branches, staff access, subscriptions, and security.', articles: ['Add a team member', 'Manage branch access', 'Review your subscription'] },
];

export function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const [openArticle, setOpenArticle] = useState('');
  const filtered = useMemo(() => topics.map((topic) => ({ ...topic, articles: topic.articles.filter((article) => `${topic.title} ${topic.description} ${article}`.toLowerCase().includes(search.toLowerCase())) })).filter((topic) => !search || topic.articles.length > 0), [search]);
  return <div className="mx-auto max-w-[1200px]">
    <PageHeading eyebrow="Support" title="Help center" description="Find clear guidance for running daily operations in SmartManager." />
    <section className="mt-7 overflow-hidden rounded-3xl bg-slate-950 px-6 py-9 text-white shadow-xl sm:px-10"><HelpCircle className="text-brand-orange-400" size={28} /><h2 className="mt-4 text-2xl font-extrabold">How can we help?</h2><p className="mt-2 text-sm text-slate-400">Search workflows, features, and administration topics.</p><div className="relative mt-6 max-w-2xl"><Search className="absolute left-4 top-3.5 text-slate-400" size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the help center" className="h-12 w-full rounded-xl border border-white/10 bg-white px-12 text-sm text-slate-950 outline-none focus:ring-4 focus:ring-orange-500/20" /></div></section>
    <section className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map(({ icon: Icon, title, description, articles }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-brand-orange-600"><Icon size={19} /></span><div><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div><div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{articles.map((article) => <div key={article}><button onClick={() => setOpenArticle(openArticle === article ? '' : article)} className="flex w-full items-center gap-3 py-3 text-left text-sm font-semibold text-slate-700 hover:text-brand-orange-600"><BookOpen size={15} className="text-slate-400" /><span className="flex-1">{article}</span><ChevronDown size={15} className={`transition ${openArticle === article ? 'rotate-180' : ''}`} /></button>{openArticle === article && <p className="pb-4 pl-7 text-xs leading-5 text-slate-500">Open the related area from the sidebar and follow the labeled actions. SmartManager validates required information before saving and reports any issue inline.</p>}</div>)}</div></article>)}</section>
    {filtered.length === 0 && <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center"><Search className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No help articles match “{search}”.</p><button onClick={() => setSearch('')} className="mt-3 text-sm font-bold text-brand-orange-600">Clear search</button></div>}
  </div>;
}
