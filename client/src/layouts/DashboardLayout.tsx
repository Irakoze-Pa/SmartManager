import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Banknote,
  Bell,
  Boxes,
  Building2,
  CircleDollarSign,
  CheckCircle2,
  FileText,
  Factory,
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
  Truck,
  Utensils,
  Shirt,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { CompanyLogo } from '../components/CompanyLogo';
import { useAuth } from '../features/auth/AuthContext';
import { useLanguage } from '../features/language/LanguageContext';

interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  available: boolean;
  group: 'Workspace' | 'Operations' | 'Insights' | 'Administration';
}

interface AppNotification { id: string; message: string; createdAt: string; read: boolean }
const readNotifications = (): AppNotification[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('smartmanager-notifications') ?? '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((item): item is AppNotification => typeof item === 'object' && item !== null && typeof item.id === 'string' && typeof item.message === 'string' && typeof item.createdAt === 'string' && typeof item.read === 'boolean').slice(0, 20);
  } catch { return []; }
};
const saveNotifications = (items: AppNotification[]): void => { try { localStorage.setItem('smartmanager-notifications', JSON.stringify(items)); } catch { /* Notifications remain available in memory when storage is unavailable. */ } };

const navigation: NavigationItem[] = [
  { label: 'Overview', path: '/', icon: LayoutDashboard, available: true, group: 'Workspace' },
  { label: 'Restaurant', path: '/restaurant', icon: Utensils, available: true, group: 'Operations' },
  { label: 'Rentals', path: '/rentals', icon: Layers3, available: true, group: 'Operations' },
  { label: 'Production', path: '/manufacturing', icon: Factory, available: true, group: 'Operations' },
  { label: 'Dry cleaning', path: '/dry-cleaning', icon: Shirt, available: true, group: 'Operations' },
  { label: 'Garment payments', path: '/dry-cleaning/payments', icon: Banknote, available: true, group: 'Operations' },
  { label: 'Point of sale', path: '/pos', icon: ShoppingCart, available: true, group: 'Operations' },
  { label: 'Products', path: '/products', icon: Package, available: true, group: 'Operations' },
  { label: 'Inventory', path: '/inventory', icon: Boxes, available: true, group: 'Operations' },
  { label: 'Purchasing', path: '/purchasing', icon: ClipboardList, available: true, group: 'Operations' },
  { label: 'Suppliers', path: '/suppliers', icon: Truck, available: true, group: 'Operations' },
  { label: 'Customers', path: '/customers', icon: Users, available: true, group: 'Operations' },
  { label: 'Finance & accounting', path: '/finance', icon: CircleDollarSign, available: true, group: 'Insights' },
  { label: 'Statements', path: '/statements', icon: FileText, available: true, group: 'Insights' },
  { label: 'Accounting center', path: '/accounting', icon: Landmark, available: true, group: 'Insights' },
  { label: 'Reports', path: '/reports', icon: BarChart3, available: true, group: 'Insights' },
  { label: 'Branches', path: '/branches', icon: Building2, available: true, group: 'Administration' },
  { label: 'Team access', path: '/team', icon: Users, available: true, group: 'Administration' },
];

const kinyarwandaNavigation: Record<string, string> = {
  Overview: 'Incamake', Restaurant: 'Resitora', Rentals: 'Ubukode', 'Point of sale': 'Ahishyurirwa',
  'Dry cleaning': 'Kumesa imyenda', 'Garment payments': 'Ubwishyu bwo kumesa',
  Products: 'Ibicuruzwa', Inventory: 'Ububiko', Purchasing: 'Amasoko', Suppliers: 'Abatanga ibicuruzwa', Customers: 'Abakiriya',
  'Finance & accounting': 'Imari n’ibaruramari', Statements: 'Inyandiko z’imari', 'Accounting center': 'Ibaruramari',
  Reports: 'Raporo', Branches: 'Amashami', 'Team access': 'Abakozi', 'Help center': 'Ubufasha', Settings: 'Igenamiterere',
  Workspace: 'Ahakorerwa', Operations: 'Imirimo', Insights: 'Isesengura', Administration: 'Imiyoborere', Menu: 'Ibikubiyemo',
};

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(readNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('smartmanager-theme') === 'dark');
  const location = useLocation();
  const { identity, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const translate = (text: string) => language === 'rw' ? kinyarwandaNavigation[text] ?? t(text) : text;
  const initials = `${identity?.user.firstName.at(0) ?? ''}${identity?.user.lastName.at(0) ?? ''}`;
  const canAdminister = identity?.user.role === 'owner' || identity?.user.role === 'admin';
  const industry = identity?.business.industry ?? 'retail';
  const isDryCleaning = industry === 'dry_cleaning';
  const sectorOperations = ['retail', 'wholesale', 'supermarket'].includes(industry) ? ['/pos', '/products', '/inventory', '/purchasing', '/suppliers', '/customers'] : industry === 'manufacturing' ? ['/manufacturing', '/pos', '/products', '/inventory', '/purchasing', '/suppliers', '/customers'] : ['building_materials', 'equipment_hire'].includes(industry) ? ['/rentals', '/inventory', '/customers'] : industry === 'restaurant' ? ['/restaurant', '/pos', '/products', '/inventory', '/purchasing', '/suppliers', '/customers'] : industry === 'dry_cleaning' ? ['/dry-cleaning', '/dry-cleaning/payments', '/customers'] : ['/customers'];
  const visibleNavigation = navigation.filter((item) => (item.group !== 'Operations' || sectorOperations.includes(item.path)) && (!['/branches', '/team'].includes(item.path) || canAdminister) && (!['/purchasing', '/suppliers'].includes(item.path) || identity?.user.role !== 'cashier') && (!['/finance', '/accounting', '/reports', '/statements'].includes(item.path) || ['owner', 'admin', 'manager'].includes(identity?.user.role ?? '')));
  const mobileNavigation = visibleNavigation.filter((item) => !['/branches', '/team'].includes(item.path)).slice(0, 3);
  const currentTitle = translate(location.pathname.startsWith('/rentals') ? 'Rentals' : location.pathname === '/settings' ? 'Settings' : location.pathname === '/help' ? 'Help center' : navigation.find((item) => item.path === location.pathname)?.label ?? 'SmartManager');

  useEffect(() => { setSidebarOpen(false); setNotificationsOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSidebarOpen(false); menuTriggerRef.current?.focus(); }
    };
    window.addEventListener('keydown', closeOnEscape);
    menuCloseRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape); };
  }, [sidebarOpen]);

  useEffect(() => {
    let timer = 0;
    const showToast = (event: Event) => {
      const message = (event as CustomEvent<unknown>).detail;
      if (typeof message !== 'string' || !message) return;
      setSuccessToast(message);
      setNotifications((current) => { const next = [{ id: `${Date.now()}-${Math.random()}`, message, createdAt: new Date().toISOString(), read: false }, ...current].slice(0, 20); saveNotifications(next); return next; });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSuccessToast(''), 4500);
    };
    window.addEventListener('smartshop:success', showToast);
    return () => { window.removeEventListener('smartshop:success', showToast); window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const update = (event: Event) => setApiLoading(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener('smartshop:api-loading', update);
    return () => window.removeEventListener('smartshop:api-loading', update);
  }, []);

  const toggleTheme = () => setDarkMode((current) => {
    const next = !current;
    localStorage.setItem('smartmanager-theme', next ? 'dark' : 'light');
    return next;
  });

  return (
    <div data-theme={darkMode ? 'dark' : 'light'} data-business-theme={industry === 'dry_cleaning' ? 'dry-cleaning' : 'default'} className="smartmanager-theme min-h-screen bg-brand-canvas">
      {apiLoading && <div role="status" aria-label="Loading data" className="fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-orange-100"><span className="block h-full w-1/3 animate-[loading-progress_1.2s_ease-in-out_infinite] rounded-full bg-brand-orange-500" /></div>}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/65 backdrop-blur-[2px] lg:hidden"
          aria-label="Close navigation"
          onClick={() => { setSidebarOpen(false); menuTriggerRef.current?.focus(); }}
        />
      )}

      <aside
        id="workspace-mobile-menu"
        className={`workspace-sidebar fixed inset-y-0 left-0 z-40 flex w-[min(86vw,320px)] flex-col text-stone-300 shadow-2xl transition-transform duration-300 lg:w-[272px] lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDryCleaning ? 'bg-[#123b3d]' : 'bg-brand-charcoal-950'}`}
      >
        <div className="flex h-[84px] items-center justify-between border-b border-white/8 px-6">
          <Logo inverse />
          <button ref={menuCloseRef} aria-label="Close navigation menu" className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden" onClick={() => { setSidebarOpen(false); menuTriggerRef.current?.focus(); }}>
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Close navigation</span>
          </button>
        </div>

        <div className="px-4 pt-5">
          <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.035] p-3 text-left shadow-inner shadow-white/[0.025]">
            <CompanyLogo name={identity?.business.name ?? 'Company'} logoUrl={identity?.business.logoUrl} className="size-11" />
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-xs capitalize ${isDryCleaning ? 'text-teal-200' : 'text-brand-orange-400'}`}>{industry.replace('_', ' ')}</span>
              <span className="block truncate text-sm font-semibold text-white">{identity?.business.name}</span>
            </span>
            <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-bold uppercase text-stone-400">Active</span>
          </div>
        </div>

        <nav className="mt-6 flex-1 overflow-y-auto px-4" aria-label="Primary navigation">
          {(['Workspace', 'Operations', 'Insights', 'Administration'] as const).map((group) => { const items = visibleNavigation.filter((item) => item.group === group); return items.length > 0 && <div key={group} className="mb-5"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400/70">{translate(group)}</p><div className="space-y-1">{items.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/dry-cleaning'} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? `${isDryCleaning ? 'bg-teal-500' : 'bg-brand-orange-500'} text-white shadow-lg before:absolute before:-left-4 before:h-6 before:w-1 before:rounded-r-full ${isDryCleaning ? 'before:bg-teal-200' : 'before:bg-brand-orange-400'}` : 'text-slate-300/75 hover:bg-white/10 hover:text-white'}`}><Icon size={18} aria-hidden="true" /><span className="flex-1">{translate(label)}</span></NavLink>)}</div></div>; })}
        </nav>

        <div className="border-t border-white/8 p-4">
          <div className="space-y-1">
            <NavLink to="/help" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/8 hover:text-white'}`}><HelpCircle size={18} />{translate('Help center')}</NavLink>
            <NavLink to="/settings" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/8 hover:text-white'}`}><Settings size={18} />{translate('Settings')}</NavLink>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3">
            <span className={`grid size-9 place-items-center rounded-full text-xs font-bold text-white ${isDryCleaning ? 'bg-gradient-to-br from-teal-300 to-teal-600' : 'bg-gradient-to-br from-brand-orange-400 to-brand-orange-600'}`}>{initials}</span>
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
          <button ref={menuTriggerRef} aria-expanded={sidebarOpen} aria-controls="workspace-mobile-menu" className="mr-3 grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/50 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} aria-hidden="true" />
            <span className="sr-only">Open navigation menu</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><span className={`size-1.5 rounded-full ${isDryCleaning ? 'bg-teal-600 shadow-[0_0_0_4px_rgba(13,148,136,0.12)]' : 'bg-brand-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.1)]'}`} /><p className="truncate text-sm font-bold text-slate-950">{currentTitle}</p></div>
            <p className="mt-1 hidden text-xs text-slate-500 sm:block">{identity?.branch.name} <span className="px-1 text-slate-300">/</span> {identity?.business.name}</p>
          </div>
          <div role="group" aria-label="Language / Ururimi" className="mr-2 flex shrink-0 rounded-xl border border-slate-200 bg-white p-0.5 text-[11px] font-bold shadow-sm">
            <button type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'} className={`rounded-lg px-2.5 py-1.5 transition ${language === 'en' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>EN</button>
            <button type="button" onClick={() => setLanguage('rw')} aria-pressed={language === 'rw'} className={`rounded-lg px-2.5 py-1.5 transition ${language === 'rw' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>RW</button>
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
          <div className="relative mr-2"><button type="button" className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-brand-orange-600" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { const opening = !notificationsOpen; setNotificationsOpen(opening); if (opening) setNotifications((current) => { const next = current.map((item) => ({ ...item, read: true })); saveNotifications(next); return next; }); }}>
            <Bell size={19} aria-hidden="true" />
            {notifications.some((item) => !item.read) && <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-brand-orange-500" />}
          </button>{notificationsOpen && <section className="absolute right-0 top-full z-[80] mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><header className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-bold text-slate-900">Notifications</h2><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={15}/></button></header><div className="max-h-80 overflow-y-auto">{notifications.length ? notifications.map((item) => <article key={item.id} className="border-b border-slate-100 px-4 py-3 last:border-0"><div className="flex gap-2"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500"/><div><p className="text-xs font-semibold text-slate-800">{item.message}</p><time className="mt-1 block text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</time></div></div></article>) : <p className="px-4 py-8 text-center text-xs text-slate-500">No notifications yet</p>}</div></section>}</div>
        </header>
        <main className="mx-auto w-full max-w-[1700px] p-4 pb-24 sm:p-6 sm:pb-8 xl:p-8"><Outlet /></main>
      </div>
      <nav className={`fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-4 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.45)] backdrop-blur-xl transition lg:hidden ${sidebarOpen ? 'hidden' : ''}`} aria-label={language === 'rw' ? 'Ibikubiyemo' : 'Mobile navigation'}>{mobileNavigation.map(({ label, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/dry-cleaning'} className={({ isActive }) => `flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-bold transition ${isActive ? `${isDryCleaning ? 'bg-teal-700 shadow-teal-900/20' : 'bg-brand-orange-500 shadow-orange-900/20'} text-white shadow-md` : 'text-slate-500 hover:bg-slate-100'}`}><Icon size={18} /><span className="max-w-full truncate">{translate(label)}</span></NavLink>)}<button type="button" onClick={() => setSidebarOpen(true)} aria-expanded={sidebarOpen} aria-controls="workspace-mobile-menu" className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100"><Menu size={18}/><span>{translate('Menu')}</span></button></nav>
      {successToast && <div role="status" aria-live="polite" className="fixed right-4 top-20 z-[70] flex w-[min(440px,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-emerald-900 shadow-xl"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19}/><p className="flex-1 font-semibold">{successToast}</p><button type="button" onClick={() => setSuccessToast('')} aria-label="Dismiss success message" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={16}/></button></div>}
    </div>
  );
}

