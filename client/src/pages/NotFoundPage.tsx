import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <div className="smartmanager-theme grid min-h-screen place-items-center bg-black p-6 text-center"><div><p className="text-sm font-bold uppercase tracking-widest text-brand-orange-600">404</p><h1 className="mt-3 text-3xl font-bold text-white">Page not found</h1><p className="mt-2 text-stone-500">This page is not available in SmartManager.</p><Link className="mt-6 inline-block rounded-xl bg-brand-orange-500 px-5 py-3 text-sm font-semibold text-white" to="/">Return to dashboard</Link></div></div>;
}

