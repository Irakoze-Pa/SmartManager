import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, BarChart3, Boxes, ClipboardList, Package, ReceiptText, ShoppingCart, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useApiHealth, type ApiHealthState } from '../hooks/useApiHealth';
import { getCatalogSummary } from '../services/catalogService';
import { getInventory, getInventoryBranches } from '../services/inventoryService';
import { getSales } from '../services/salesService';
import type { InventoryItem, SaleSummary, TenantBranch } from '../types/api';
import { IndustryDashboard } from '../components/IndustryDashboard';

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
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([getInventoryBranches(), getInventory(), getSales(), getCatalogSummary()]).then(([branchResult, inventoryResult, salesResult, catalogResult]) => {
      if (branchResult.status === 'fulfilled') setBranches(branchResult.value);
      if (inventoryResult.status === 'fulfilled') setInventory(inventoryResult.value);
      if (salesResult.status === 'fulfilled') setSales(salesResult.value);
      if (catalogResult.status === 'fulfilled') setProductCount(catalogResult.value.activeProducts);
      if ([branchResult, inventoryResult, salesResult, catalogResult].some((result) => result.status === 'rejected')) setError('Some overview data is temporarily unavailable.');
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
  const salesTrend = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - index));
    const next = new Date(date); next.setDate(next.getDate() + 1);
    const dailySales = sales.filter((sale) => { const created = new Date(sale.createdAt); return created >= date && created < next; });
    return { label: date.toLocaleDateString(undefined, { weekday: 'short' }), revenue: dailySales.reduce((sum, sale) => sum + sale.total, 0), transactions: dailySales.length };
  }), [sales]);
  const maxTrendRevenue = Math.max(...salesTrend.map((day) => day.revenue), 1);
  const metrics = [
    { label: "Today's revenue", value: todayRevenue.toLocaleString(), detail: `${todaySales.length} completed sales`, icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Average sale', value: averageSale.toLocaleString(undefined, { maximumFractionDigits: 0 }), detail: 'Per transaction today', icon: ReceiptText, tone: 'bg-orange-50 text-brand-orange-600' },
    { label: wholesale ? 'Units available for orders' : 'Stock on hand', value: totalUnits.toLocaleString(), detail: `${productCount} active products`, icon: Package, tone: 'bg-blue-50 text-blue-700' },
    { label: wholesale ? 'Products to replenish' : 'Low-stock alerts', value: lowStockItems.length.toLocaleString(), detail: lowStockItems.length ? 'Needs attention' : 'Stock levels healthy', icon: AlertTriangle, tone: lowStockItems.length ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600' },
  ];
  const retailActions = [
    { title: 'Checkout', detail: 'Scan items and complete a customer sale', path: '/pos', icon: ShoppingCart, tone: 'bg-orange-50 text-orange-700' },
    { title: 'Replenish stock', detail: 'Review low stock and prepare supplier orders', path: '/purchasing', icon: Boxes, tone: 'bg-blue-50 text-blue-700' },
    { title: 'Stock count & waste', detail: 'Record counted quantities and write-offs', path: '/inventory', icon: ClipboardList, tone: 'bg-amber-50 text-amber-700' },
    { title: 'Sales & performance', detail: 'Review products, payments, and daily results', path: '/reports', icon: BarChart3, tone: 'bg-emerald-50 text-emerald-700' },
  ];
  const wholesaleActions = [
    { title: 'Bulk sales', detail: 'Create a customer order with case and package pricing', path: '/pos', icon: ShoppingCart, tone: 'bg-orange-50 text-orange-700' },
    { title: 'Supplier replenishment', detail: 'Manage purchase orders and incoming stock', path: '/purchasing', icon: Boxes, tone: 'bg-blue-50 text-blue-700' },
    { title: 'Product & pack pricing', detail: 'Set up products, units, and package prices', path: '/products', icon: Package, tone: 'bg-amber-50 text-amber-700' },
    { title: 'Customer accounts', detail: 'Review business customers and account balances', path: '/customers', icon: ClipboardList, tone: 'bg-emerald-50 text-emerald-700' },
  ];
  const operations = wholesale ? wholesaleActions : retailActions;

  return <div className="mx-auto max-w-[1500px]">
    <header className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-7"><div className="flex flex-wrap items-center justify-between gap-5"><div><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500"><span>{identity?.business.name}</span><span className="text-slate-300">/</span><span>{locationLabel}</span><span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${healthCopy[health].className}`}>{healthCopy[health].label}</span></div><h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{wholesale ? 'Wholesale operations' : 'Retail command center'}</h1><p className="mt-2 text-sm text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · Welcome, {identity?.user.firstName}</p></div><Link to="/pos" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"><ShoppingCart size={17} />{wholesale ? 'New bulk sale' : 'New sale'} <ArrowRight size={15} /></Link></div></header>
    {error && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}
    <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{loading ? '—' : value}</p></div><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span></div><p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">{detail}</p></article>)}</section>
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-brand-orange-600"><Package size={19}/></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{wholesale ? 'Wholesale workflow' : 'Retail workflow'}</p><h2 className="mt-1 font-bold text-slate-950">{wholesale ? 'Orders and replenishment' : 'Daily store operations'}</h2><p className="mt-1 text-sm text-slate-500">{wholesale ? 'Coordinate bulk orders, package pricing, supplier replenishment, and customer accounts.' : 'Move from checkout to replenishment and close the loop with stock control.'}</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{operations.filter(({path})=>(path!=='/reports'||canSeeFinance)&&(path!=='/purchasing'||identity?.user.role!=='cashier')).map(({title,detail,path,icon:Icon,tone})=><Link key={path} to={path} className="group rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-sm"><span className={`grid size-9 place-items-center rounded-lg ${tone}`}><Icon size={17}/></span><span className="mt-3 flex items-center justify-between gap-2 text-sm font-bold text-slate-900">{title}<ArrowRight size={14} className="text-slate-300 transition group-hover:text-brand-orange-600"/></span><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></Link>)}</div></section>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sales performance</p><h2 className="mt-1 font-bold text-slate-950">Last 7 days</h2></div>{canSeeFinance && <Link to="/reports" className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange-600">Open reports <ArrowRight size={14} /></Link>}</div><div className="mt-8 flex h-52 items-end gap-2 sm:gap-4">{salesTrend.map((day) => <div key={day.label} className="flex h-full min-w-0 flex-1 flex-col justify-end"><div className="group relative flex flex-1 items-end"><div title={`${day.revenue.toLocaleString()} · ${day.transactions} sales`} className="w-full rounded-t-lg bg-gradient-to-t from-brand-orange-600 to-brand-orange-400 transition hover:from-brand-orange-500 hover:to-orange-300" style={{ height: `${Math.max(day.revenue ? (day.revenue / maxTrendRevenue) * 100 : 3, 3)}%` }} /></div><p className="mt-3 text-center text-[10px] font-bold uppercase text-slate-400">{day.label}</p></div>)}</div></section>
      <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory attention</p><h2 className="mt-1 font-bold text-slate-950">Low-stock products</h2></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${lowStockItems.length ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{lowStockItems.length}</span></div><div className="divide-y divide-slate-100 px-5">{lowStockItems.slice(0, 5).map((item) => <div key={`${item.branchId}-${item.productId}`} className="flex items-center justify-between gap-3 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{item.productName}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{item.branchName} · Reorder at {item.reorderLevel}</p></div><span className="shrink-0 text-sm font-extrabold text-amber-700">{item.quantity} {item.unit}</span></div>)}{!loading && lowStockItems.length === 0 && <div className="py-10 text-center"><Boxes className="mx-auto text-emerald-400" /><p className="mt-3 text-sm font-semibold text-slate-700">Stock levels look healthy</p><p className="mt-1 text-xs text-slate-400">No products are below their reorder level.</p></div>}</div>{lowStockItems.length > 5 && <Link to="/inventory" className="block border-t border-slate-100 p-4 text-center text-xs font-bold text-brand-orange-600">View all inventory</Link>}</aside>
    </div>
  </div>;
}

export function DashboardPage() {
  const { identity } = useAuth();
  if (!identity) return null;
  return ['retail', 'wholesale'].includes(identity.business.industry) ? <RetailDashboard wholesale={identity.business.industry === 'wholesale'} /> : <IndustryDashboard identity={identity} />;
}
