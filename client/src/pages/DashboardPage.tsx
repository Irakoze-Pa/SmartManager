import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, BarChart3, Boxes, ClipboardList, Package, ReceiptText, ShoppingCart, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useApiHealth, type ApiHealthState } from '../hooks/useApiHealth';
import { getCatalogSummary } from '../services/catalogService';
import { getInventory, getInventoryBranches } from '../services/inventoryService';
import { getSales, getSalesAnalytics, type SalesAnalytics } from '../services/salesService';
import type { InventoryItem, SaleSummary, TenantBranch } from '../types/api';
import { IndustryDashboard } from '../components/IndustryDashboard';
import { DataLoading } from '../components/DataLoading';

const healthCopy: Record<ApiHealthState, { label: string; className: string }> = {
  checking: { label: 'Checking', className: 'bg-amber-50 text-amber-700' },
  online: { label: 'Connected', className: 'bg-emerald-50 text-emerald-700' },
  degraded: { label: 'Database unavailable', className: 'bg-amber-50 text-amber-700' },
  offline: { label: 'API unavailable', className: 'bg-rose-50 text-rose-700' },
};

function RetailDashboard({ wholesale = false }: { wholesale?: boolean }) {
  const { identity } = useAuth();
  const health = useApiHealth();
  const [branches, setBranches] = useState<TenantBranch[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics>({ daily: [], topProducts: [] });
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([getInventoryBranches(), getInventory(), getSales(), getCatalogSummary(), getSalesAnalytics()]).then(([branchResult, inventoryResult, salesResult, catalogResult, analyticsResult]) => {
      if (branchResult.status === 'fulfilled') setBranches(branchResult.value);
      if (inventoryResult.status === 'fulfilled') setInventory(inventoryResult.value);
      if (salesResult.status === 'fulfilled') setSales(salesResult.value);
      if (catalogResult.status === 'fulfilled') setProductCount(catalogResult.value.activeProducts);
      if (analyticsResult.status === 'fulfilled') setSalesAnalytics(analyticsResult.value);
      if ([branchResult, inventoryResult, salesResult, catalogResult, analyticsResult].some((result) => result.status === 'rejected')) setError('Some overview data is temporarily unavailable.');
      setLoading(false);
    });
  }, []);
  useEffect(() => { void refreshDashboard(); }, [refreshDashboard]);
  useEffect(() => { const refresh = () => void refreshDashboard(); window.addEventListener('smartshop:workspace-updated', refresh); return () => window.removeEventListener('smartshop:workspace-updated', refresh); }, [refreshDashboard]);

  const todayKey = new Date().toDateString();
  const todaySales = useMemo(() => sales.filter((sale) => new Date(sale.createdAt).toDateString() === todayKey), [sales, todayKey]);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const averageSale = todaySales.length ? todayRevenue / todaySales.length : 0;
  const lowStockItems = inventory.filter((item) => item.quantity <= item.reorderLevel).sort((a, b) => a.quantity - b.quantity);
  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const locationLabel = branches.length > 1 ? `${branches.length} branches` : branches[0]?.name ?? 'Main shop';
  const canSeeFinance = ['owner', 'admin', 'manager'].includes(identity?.user.role ?? '');
  const salesTrend = useMemo(() => salesAnalytics.daily.map((day) => ({ ...day, label: new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }) })), [salesAnalytics]);
  const maxTrendRevenue = Math.max(...salesTrend.map((day) => day.revenue), 1);
  const maxTopProductQuantity = Math.max(...salesAnalytics.topProducts.map((product) => product.quantity), 1);
  const trendRevenue = salesTrend.reduce((sum, day) => sum + day.revenue, 0);
  const trendTransactions = salesTrend.reduce((sum, day) => sum + day.transactions, 0);
  const metrics = [
    { label: "Today's revenue", value: todayRevenue.toLocaleString(), meta: `${todaySales.length} sales`, icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Average transaction', value: averageSale.toLocaleString(undefined, { maximumFractionDigits: 0 }), meta: 'RWF today', icon: ReceiptText, tone: 'bg-orange-50 text-brand-orange-600' },
    { label: wholesale ? 'Units available' : 'Units in stock', value: totalUnits.toLocaleString(), meta: `${productCount} active products`, icon: Package, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Low-stock products', value: lowStockItems.length.toLocaleString(), meta: lowStockItems.length ? 'Action required' : 'No alerts', icon: AlertTriangle, tone: lowStockItems.length ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600' },
  ];
  const retailActions = [
    { title: 'New sale', path: '/pos', icon: ShoppingCart, tone: 'bg-orange-50 text-orange-700' },
    { title: 'Purchasing', path: '/purchasing', icon: Boxes, tone: 'bg-blue-50 text-blue-700' },
    { title: 'Inventory', path: '/inventory', icon: ClipboardList, tone: 'bg-amber-50 text-amber-700' },
    { title: 'Reports', path: '/reports', icon: BarChart3, tone: 'bg-emerald-50 text-emerald-700' },
  ];
  const wholesaleActions = [
    { title: 'Bulk sale', path: '/pos', icon: ShoppingCart, tone: 'bg-orange-50 text-orange-700' },
    { title: 'Purchasing', path: '/purchasing', icon: Boxes, tone: 'bg-blue-50 text-blue-700' },
    { title: 'Products & pricing', path: '/products', icon: Package, tone: 'bg-amber-50 text-amber-700' },
    { title: 'Customers', path: '/customers', icon: ClipboardList, tone: 'bg-emerald-50 text-emerald-700' },
  ];
  const operations = wholesale ? wholesaleActions : retailActions;

  return <div className="mx-auto max-w-[1500px] space-y-5">
    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-7"><div className="flex min-w-0 items-center gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-900 text-white"><ShoppingCart size={21}/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"><span className="truncate">{identity?.business.name}</span><span className="text-slate-300">/</span><span>{locationLabel}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${healthCopy[health].className}`}>{healthCopy[health].label}</span></div><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{wholesale ? 'Wholesale overview' : 'Retail overview'}</h1><p className="mt-1 text-xs text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p></div></div><Link to="/pos" className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800"><ShoppingCart size={16} />{wholesale ? 'New bulk sale' : 'New sale'}<ArrowRight size={15} /></Link></div></header>
    {error && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, meta, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{loading ? '—' : value}</p></div><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span></div><p className="mt-2 text-xs font-medium text-slate-500">{meta}</p></article>)}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p><h2 className="mt-1 font-bold text-slate-950">Quick access</h2></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{operations.filter(({path})=>(path!=='/reports'||canSeeFinance)&&(path!=='/purchasing'||identity?.user.role!=='cashier')).map(({title,path,icon:Icon,tone})=><Link key={path} to={path} className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:border-slate-300 hover:bg-slate-50"><span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={17}/></span><span className="flex-1 text-sm font-bold text-slate-800">{title}</span><ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-700"/></Link>)}</div></section>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Sales performance · 7 days</p><h2 className="mt-1 font-bold text-slate-950">Sales trend</h2></div>{canSeeFinance && <Link to="/reports" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-brand-orange-600">Reports <ArrowRight size={14} /></Link>}</div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Revenue</p><p className="mt-1 text-lg font-extrabold text-slate-950">{loading ? '—' : trendRevenue.toLocaleString()} <span className="text-xs font-semibold text-slate-500">RWF</span></p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Transactions</p><p className="mt-1 text-lg font-extrabold text-slate-950">{loading ? '—' : trendTransactions.toLocaleString()}</p></div></div><div className="mt-5 flex h-36 items-end gap-2 border-b border-slate-100 pb-2 sm:gap-4">{loading ? <DataLoading label="Loading sales trend…" compact /> : salesTrend.map((day) => <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col justify-end"><div className="group relative flex flex-1 items-end"><div title={`${day.revenue.toLocaleString()} RWF · ${day.transactions} sales`} className="w-full rounded-t-md bg-brand-orange-500 transition hover:bg-brand-orange-600" style={{ height: `${Math.max(day.revenue ? (day.revenue / maxTrendRevenue) * 100 : 3, 3)}%` }} /></div><p className="mt-2 text-center text-[10px] font-semibold uppercase text-slate-400">{day.label}</p></div>)}</div><div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><span className="size-2 rounded-full bg-brand-orange-500"/>Daily revenue</div></section>
      <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Product performance · 7 days</p><h2 className="mt-1 font-bold text-slate-950">Top selling</h2></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{loading ? '—' : salesAnalytics.topProducts.length}</span></div><div className="divide-y divide-slate-100 px-5">{salesAnalytics.topProducts.map((product, index) => <div key={product.productId} className="py-3.5"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-extrabold text-slate-600">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{product.name}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{product.sku || 'No SKU'}</p></div></div><div className="shrink-0 text-right"><p className="text-sm font-extrabold text-slate-900">{product.quantity.toLocaleString()} <span className="text-[10px] font-semibold text-slate-500">units</span></p><p className="text-[10px] text-slate-500">{product.revenue.toLocaleString()} RWF</p></div></div><div className="ml-10 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max((product.quantity / maxTopProductQuantity) * 100, 4)}%` }}/></div></div>)}{loading ? <DataLoading label="Loading sales data…" compact /> : salesAnalytics.topProducts.length === 0 && <div className="py-9 text-center"><Package className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-700">No product sales in this period</p></div>}</div>{salesAnalytics.topProducts.length > 0 && <Link to="/reports" className="block border-t border-slate-100 p-4 text-center text-xs font-bold text-slate-600 hover:text-brand-orange-600">View sales reports <ArrowRight className="ml-1 inline" size={13}/></Link>}</aside>
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Activity</p><h2 className="mt-1 font-bold text-slate-950">Recent sales</h2></div><Link to="/pos" className="text-xs font-bold text-slate-600 hover:text-brand-orange-600">All sales<ArrowRight className="ml-1 inline" size={13}/></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Receipt</th><th className="px-5 py-3">Time</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{sales.slice(0, 6).map((sale) => <tr key={sale.id}><td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{sale.receiptNumber}</td><td className="px-5 py-3.5 text-sm text-slate-500">{new Date(sale.createdAt).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</td><td className="px-5 py-3.5 text-sm text-slate-600">{sale.itemCount}</td><td className="px-5 py-3.5 text-sm capitalize text-slate-600">{sale.paymentMethod.replace('_',' ')}</td><td className="px-5 py-3.5"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${sale.paymentStatus==='paid'?'bg-emerald-50 text-emerald-700':sale.paymentStatus==='partial'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-600'}`}>{sale.paymentStatus}</span></td><td className="px-5 py-3.5 text-right text-sm font-bold text-slate-900">{sale.total.toLocaleString()} RWF</td></tr>)}</tbody></table>{loading ? <DataLoading label="Loading recent sales…" /> : sales.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No sales recorded</p>}</div></section>
  </div>;
}

export function DashboardPage() {
  const { identity } = useAuth();
  if (!identity) return null;
  return ['retail', 'wholesale'].includes(identity.business.industry) ? <RetailDashboard wholesale={identity.business.industry === 'wholesale'} /> : <IndustryDashboard identity={identity} />;
}
