import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { Logo } from '../components/Logo';
import { FormField } from '../components/FormField';
import { usePlatformAuth } from '../features/platform/PlatformAuthContext';
import { getApiErrorMessage } from '../services/apiClient';

export function PlatformLoginPage() {
  const { admin, login } = usePlatformAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (admin) return <Navigate to="/platform" replace />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try { await login(String(data.get('email')), String(data.get('password'))); navigate('/platform', { replace: true }); }
    catch (requestError: unknown) { setError(getApiErrorMessage(requestError, 'The platform API could not be reached.')); }
    finally { setBusy(false); }
  };
  return (
    <main className="smartmanager-theme relative grid min-h-screen place-items-center overflow-hidden bg-[#f5f7fb] p-5"><div className="absolute -left-40 top-1/3 size-96 rounded-full bg-orange-500/10 blur-3xl" /><div className="absolute -right-32 -top-32 size-96 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-900/10 sm:p-9">
        <Logo /><div className="mt-8 flex size-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-brand-orange-600"><LockKeyhole size={21} /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-orange-600">Platform administration</p>
        <h1 className="mt-2 text-3xl font-extrabold text-brand-charcoal-950">Superadmin sign in</h1>
        <p className="mt-2 text-sm text-stone-500">Restricted access for SmartManager platform operations.</p>
        <form className="mt-7 space-y-5" onSubmit={(event) => void submit(event)}>
          {error && <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-brand-orange-500">{error}</div>}
          <FormField id="platform-email" name="email" label="Administrator email" type="email" required />
          <FormField id="platform-password" name="password" label="Password" type="password" required />
          <button disabled={busy} className="h-12 w-full rounded-xl bg-brand-orange-500 text-sm font-bold text-white transition hover:bg-brand-orange-600 disabled:opacity-60">{busy ? 'Authenticating…' : 'Access platform'}</button>
        </form>
      </div>
    </main>
  );
}

