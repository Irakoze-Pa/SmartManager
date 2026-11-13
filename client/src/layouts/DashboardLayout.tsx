import { useState } from 'react';
import {
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CircleDollarSign,
  FileText,
  Landmark,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Layers3,
  Settings,
  ShoppingCart,
  Sun,
  Utensils,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { CompanyLogo } from '../components/CompanyLogo';
import { useAuth } from '../features/auth/AuthContext';

interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  available: boolean;
  group: 'Workspace' | 'Operations' | 'Insights' | 'Administration';
}

const navigation: NavigationItem[] = [
  { label: 'Overview', path: '/', icon: LayoutDashboard, available: true, group: 'Workspace' },
  { label: 'Restaurant', path: '/restaurant', icon: Utensils, available: true, group: 'Operations' },
  { label: 'Rentals', path: '/rentals', icon: Layers3, available: true, group: 'Operations' },
  { label: 'Point of sale', path: '/pos', icon: ShoppingCart, available: true, group: 'Operations' },
  { label: 'Products', path: '/products', icon: Package, available: true, group: 'Operations' },
  { label: 'Inventory', path: '/inventory', icon: Boxes, available: true, group: 'Operations' },
  { label: 'Purchasing', path: '/purchasing', icon: ClipboardList, available: true, group: 'Operations' },
  { label: 'Customers', path: '/customers', icon: Users, available: true, group: 'Operations' },
  { label: 'Finance & accounting', path: '/finance', icon: CircleDollarSign, available: true, group: 'Insights' },
  { label: 'Statements', path: '/statements', icon: FileText, available: true, group: 'Insights' },
  { label: 'Accounting center', path: '/accounting', icon: Landmark, available: true, group: 'Insights' },
  { label: 'Reports', path: '/reports', icon: BarChart3, available: true, group: 'Insights' },
  { label: 'Branches', path: '/branches', icon: Building2, available: true, group: 'Administration' },
  { label: 'Team access', path: '/team', icon: Users, available: true, group: 'Administration' },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('smartmanager-theme') === 'dark');
  const location = useLocation();
  const { identity, logout } = useAuth();
  const initials = `${identity?.user.firstName.at(0) ?? ''}${identity?.user.lastName.at(0) ?? ''}`;
  const canAdminister = identity?.user.role === 'owner' || identity?.user.role === 'admin';
  const industry = identity?.business.industry ?? 'retail';
  const sectorOperations = industry === 'retail' ? ['/pos', '/products', '/inventory', '/purchasing', '/customers'] : industry === 'building_materials' ? ['/rentals', '/inventory', '/purchasing', '/customers'] : industry === 'restaurant' ? ['/restaurant', '/pos', '/products', '/inventory', '/purchasing', '/customers'] : ['/customers'];
  const visibleNavigation = navigation.filter((item) => (item.group !== 'Operations' || sectorOperations.includes(item.path)) && (!['/branches', '/team'].includes(item.path) || canAdminister) && (item.path !== '/purchasing' || identity?.user.role !== 'cashier') && (!['/finance', '/accounting', '/reports', '/statements'].includes(item.path) || ['owner', 'admin', 'manager'].includes(identity?.user.role ?? '')));
  const mobileNavigation = visibleNavigation.filter((item) => !['/branches', '/team'].includes(item.path)).slice(0, 3);
  const currentTitle = location.pathname === '/settings' ? 'Settings' : location.pathname === '/help' ? 'Help center' : navigation.find((item) => item.path === location.pathname)?.label ?? 'SmartManager';

  const toggleTheme = () => setDarkMode((current) => {
    const next = !current;
    localStorage.setItem('smartmanager-theme', next ? 'dark' : 'light');
    return next;
  });

  return (
    <div data-theme={darkMode ? 'dark' : 'light'} className="smartmanager-theme min-h-screen bg-brand-canvas">
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-brand-charcoal-950/55 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col bg-brand-charcoal-950 text-stone-300 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[84px] items-center justify-between border-b border-white/8 px-6">
          <Logo inverse />
          <button className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Close navigation</span>
          </button>
        </div>

        <div className="px-4 pt-5">
          <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.035] p-3 text-left shadow-inner shadow-white/[0.025]">
            <CompanyLogo name={identity?.business.name ?? 'Company'} logoUrl={identity?.business.logoUrl} className="size-11" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs capitalize text-brand-orange-400">{industry.replace('_', ' ')}</span>
              <span className="block truncate text-sm font-semibold text-white">{identity?.business.name}</span>
            </span>
            <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-bold uppercase text-stone-400">Active</span>
          </div>
        </div>

        <nav className="mt-6 flex-1 overflow-y-auto px-4" aria-label="Primary navigation">
          {(['Workspace', 'Operations', 'Insights', 'Administration'] as const).map((group) => { const items = visibleNavigation.filter((item) => item.group === group); return items.length > 0 && <div key={group} className="mb-5"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{group}</p><div className="space-y-1">{items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand-orange-500 text-white shadow-lg shadow-orange-950/20 before:absolute before:-left-4 before:h-6 before:w-1 before:rounded-r-full before:bg-brand-orange-400' : 'text-slate-400 hover:bg-white/8 hover:text-white'}`}><Icon size={18} aria-hidden="true" /><span className="flex-1">{label}</span></NavLink>)}</div></div>; })}
        </nav>

        <div className="border-t border-white/8 p-4">
          <div className="space-y-1">
            <NavLink to="/help" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/8 hover:text-white'}`}><HelpCircle size={18} />Help center</NavLink>
            <NavLink to="/settings" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/8 hover:text-white'}`}><Settings size={18} />Settings</NavLink>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.06] p-3">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-orange-400 to-brand-orange-600 text-xs font-bold text-white">{initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{identity?.user.firstName} {identity?.user.lastName}</span>
              <span className="block truncate text-xs capitalize text-slate-400">{identity?.user.role}</span>
            </span>
            <button onClick={logout} className="rounded-lg p-2 text-stone-400 transition hover:bg-white/10 hover:text-white" title="Sign out"><LogOut size={16} /><span className="sr-only">Sign out</span></button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="workspace-header sticky top-0 z-20 flex h-[76px] items-center border-b border-slate-200/80 bg-white/90 px-4 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:px-8">
          <button className="mr-4 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} aria-hidden="true" />
            <span className="sr-only">Open navigation</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-brand-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.1)]" /><p className="truncate text-sm font-bold text-slate-950">{currentTitle}</p></div>
            <p className="mt-1 hidden text-xs text-slate-500 sm:block">{identity?.branch.name} <span className="px-1 text-slate-300">/</span> {identity?.business.name}</p>
          </div>
          <div className="mr-3 hidden text-right md:block"><p className="text-xs font-semibold text-slate-700">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p><p className="mt-0.5 text-[10px] capitalize text-slate-400">{industry.replace('_', ' ')} workspace</p></div>
          <button
            className="mr-2 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-brand-orange-600"
            aria-label={darkMode ? 'Use light mode' : 'Use dark mode'}
            title={darkMode ? 'Use light mode' : 'Use dark mode'}
            onClick={toggleTheme}
          >
            {darkMode ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
          </button>
          <button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-brand-orange-600" aria-label="Notifications">
            <Bell size={19} aria-hidden="true" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-orange-500" />
          </button>
        </header>
        <main className="mx-auto w-full max-w-[1700px] p-4 pb-24 sm:p-6 sm:pb-8 xl:p-8"><Outlet /></main>
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">{mobileNavigation.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold transition ${isActive ? 'bg-brand-orange-500 text-white shadow-md shadow-orange-900/20' : 'text-slate-500'}`}><Icon size={18} /><span className="truncate">{label}</span></NavLink>)}<NavLink to="/settings" className={({ isActive }) => `flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold transition ${isActive ? 'bg-brand-orange-500 text-white shadow-md shadow-orange-900/20' : 'text-slate-500'}`}><Settings size={18} /><span>Settings</span></NavLink></nav>
    </div>
  );
}

