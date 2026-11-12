import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { getApiErrorMessage } from '../services/apiClient';

export function LoginPage() {
  const { identity, login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false); const [showPassword, setShowPassword] = useState(false);
  if (identity) return <Navigate to="/" replace />;
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(''); setSubmitting(true); const data = new FormData(event.currentTarget); try { await login({ email: String(data.get('email')).trim(), password: String(data.get('password')) }); const destination = typeof location.state === 'object' && location.state && 'from' in location.state ? String(location.state.from) : '/'; navigate(destination, { replace: true }); } catch (requestError: unknown) { setError(getApiErrorMessage(requestError, 'SmartManager could not sign you in. Check your connection and try again.')); } finally { setSubmitting(false); } };

  return <div>
    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-orange-500">Account access</p>
    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Sign in</h2>
    <p className="mt-2 text-sm text-slate-500">Enter your account details.</p>
    <form className="mt-8 space-y-5" onSubmit={(event) => void submit(event)}>
      {error && <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-brand-orange-500" role="alert">{error}</div>}
      <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Email address</span><input id="email" name="email" type="email" autoComplete="email" inputMode="email" required autoFocus placeholder="name@company.com" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-brand-orange-500 focus:ring-4 focus:ring-orange-500/10" /></label>
      <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Password</span><span className="relative block"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="Enter your password" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-brand-orange-500 focus:ring-4 focus:ring-orange-500/10" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
      <button disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-orange-500 text-sm font-bold text-white shadow-lg shadow-orange-950/30 hover:bg-brand-orange-600 disabled:cursor-wait disabled:opacity-60">{submitting ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Signing in…</> : <>Sign in <ArrowRight size={17} /></>}</button>
    </form>
  </div>;
}
