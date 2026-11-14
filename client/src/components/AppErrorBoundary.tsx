import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the diagnostic available to browser tooling without exposing details to users.
    console.error('Workspace screen failed to render', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <main role="alert" className="grid min-h-screen place-items-center bg-slate-50 p-5 text-slate-900"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-700"><AlertTriangle size={22} /></span><h1 className="mt-5 text-xl font-extrabold tracking-tight">This page couldn’t load</h1><p className="mt-2 text-sm leading-6 text-slate-500">Refresh the workspace and try again. Your saved business data is unchanged.</p><button type="button" onClick={() => window.location.reload()} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700"><RefreshCw size={16} />Refresh workspace</button></section></main>;
    }
    return this.props.children;
  }
}
