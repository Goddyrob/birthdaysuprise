import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, LogOut, RefreshCw } from 'lucide-react';


type AdminOverview = { totalSurprises: number; createdLastSevenDays: number };
type AdminSurprise = { id: string; recipient_name: string; sender_name: string; created_at: string };
type DailyCount = { date: string; surprises: number };

const request = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Request failed');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
};

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [surprises, setSurprises] = useState<AdminSurprise[]>([]);
  const [daily, setDaily] = useState<DailyCount[]>([]);
  const [errorsAvailable, setErrorsAvailable] = useState(false);

  const loadDashboard = async () => {
    const [overviewData, surprisesData, analyticsData, errorsData] = await Promise.all([
      request<AdminOverview>('/api/admin/overview'),
      request<{ surprises: AdminSurprise[] }>('/api/admin/surprises'),
      request<{ daily: DailyCount[] }>('/api/admin/analytics'),
      request<{ available: boolean }>('/api/admin/errors'),
    ]);
    setOverview(overviewData);
    setSurprises(surprisesData.surprises);
    setDaily(analyticsData.daily);
    setErrorsAvailable(errorsData.available);
  };

  useEffect(() => {
    let active = true;
    request<{ authenticated: boolean; expiresAt: string }>('/api/admin/session')
      .then(async ({ expiresAt }) => {
        if (!active) return;
        setSessionExpiresAt(expiresAt);
        setAuthenticated(true);
        await loadDashboard();
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authenticated || !sessionExpiresAt) return;
    const remaining = Date.parse(sessionExpiresAt) - Date.now();
    if (remaining <= 0) {
      setAuthenticated(false);
      setOverview(null);
      setSurprises([]);
      setDaily([]);
      setMessage('Session expired. Sign in again.');
      return;
    }
    const timeout = window.setTimeout(() => {
      setAuthenticated(false);
      setOverview(null);
      setSurprises([]);
      setDaily([]);
      setSessionExpiresAt(null);
      setMessage('Session expired. Sign in again.');
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [authenticated, sessionExpiresAt]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const session = await request<{ expiresAt: string }>('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      setPassword('');
      setSessionExpiresAt(session.expiresAt);
      setAuthenticated(true);
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    setBusy(true);
    setMessage('');
    try {
      await loadDashboard();
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        setAuthenticated(false);
        setSessionExpiresAt(null);
        setOverview(null);
        setSurprises([]);
        setDaily([]);
      }
      setMessage(error instanceof Error ? error.message : 'Unable to refresh dashboard');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    setMessage('');
    try {
      await request('/api/admin/logout', { method: 'POST' });
      setAuthenticated(false);
      setSessionExpiresAt(null);
      setOverview(null);
      setSurprises([]);
      setDaily([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign out');
    } finally {
      setBusy(false);
    }
  };

  if (checkingSession) {
    return <main className="grid min-h-screen place-items-center bg-[#f6f5f0] text-sm text-[#51625d]">Checking secure session...</main>;
  }

  if (!authenticated) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f6f5f0] px-5 py-12 text-[#17352f]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[#dbe9df]" />
        <section className="relative w-full max-w-md border border-[#d3ded6] bg-[#fffefa] p-8 shadow-[0_22px_70px_-45px_rgba(23,53,47,0.5)] sm:p-10">
          <div className="mb-8 flex h-11 w-11 items-center justify-center bg-[#17352f] text-[#f5cf8d]"><KeyRound size={20} /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#657a70]">Dearli / Private access</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold">Admin sign in</h1>
          <p className="mt-2 text-sm leading-6 text-[#65716c]">Authenticate to continue to the owner dashboard.</p>
          <form className="mt-8 space-y-4" onSubmit={handleLogin}>
            <label className="block text-sm font-medium" htmlFor="admin-password">Password</label>
            <input
              autoComplete="current-password"
              className="h-12 w-full border border-[#cbd6ce] bg-white px-3 text-base outline-none focus:border-[#1d6552]"
              id="admin-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            {message && <p className="text-sm text-[#a33e3e]" role="alert">{message}</p>}
            <button className="h-12 w-full bg-[#17352f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#255447] disabled:opacity-60" disabled={busy} type="submit">
              {busy ? 'Verifying...' : 'Sign in'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const peak = Math.max(1, ...daily.map((item) => item.surprises));
  return (
    <main className="min-h-screen bg-[#f6f5f0] text-[#17352f]">
      <header className="flex min-h-20 items-center justify-between border-b border-[#dce2db] bg-[#fffefa] px-5 sm:px-10">
        <div>
          <p className="font-serif text-xl font-semibold">Dearli</p>
          <p className="text-xs text-[#657a70]">Owner dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Refresh dashboard" className="grid h-10 w-10 place-items-center border border-[#d3ded6] hover:bg-[#edf2eb] disabled:opacity-50" disabled={busy} onClick={handleRefresh} title="Refresh dashboard" type="button"><RefreshCw size={17} /></button>
          <button className="flex h-10 items-center gap-2 border border-[#d3ded6] px-3 text-sm hover:bg-[#edf2eb] disabled:opacity-50" disabled={busy} onClick={handleLogout} type="button"><LogOut size={16} /><span>Sign out</span></button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#728279]">Overview</p><h1 className="mt-2 font-serif text-3xl font-semibold">Your surprises</h1></div>
          <p className="text-sm text-[#68766f]">Private owner access</p>
        </div>
        {message && <p className="mt-5 border-l-2 border-[#b7594b] bg-white px-4 py-3 text-sm text-[#8c3c34]" role="alert">{message}</p>}
        <section aria-label="Surprise totals" className="mt-8 grid gap-px border border-[#dce2db] bg-[#dce2db] sm:grid-cols-2">
          <div className="bg-[#fffefa] p-6"><p className="text-sm text-[#657a70]">Total surprises</p><p className="mt-3 font-serif text-4xl">{overview?.totalSurprises ?? '—'}</p></div>
          <div className="bg-[#fffefa] p-6"><p className="text-sm text-[#657a70]">Created in the last 7 days</p><p className="mt-3 font-serif text-4xl">{overview?.createdLastSevenDays ?? '—'}</p></div>
        </section>
        <section className="mt-10 border-t border-[#dce2db] pt-6">
          <div className="flex items-baseline justify-between gap-3"><h2 className="font-serif text-xl font-semibold">Creation activity</h2><span className="text-xs text-[#748078]">Last 30 days</span></div>
          <div className="mt-5 grid h-36 items-end gap-1 sm:gap-2" style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }} role="img" aria-label="Daily surprise creations during the last 30 days">
            {daily.map((item) => <div className="group relative flex h-full items-end" key={item.date} title={`${item.date}: ${item.surprises}`}><div className="w-full min-h-1 bg-[#4d806d]" style={{ height: `${Math.max(3, item.surprises / peak * 100)}%` }} /><span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap bg-[#17352f] px-2 py-1 text-[10px] text-white group-hover:block">{item.date}: {item.surprises}</span></div>)}
          </div>
        </section>
        <section className="mt-10 border-t border-[#dce2db] pt-6">
          <div className="flex items-baseline justify-between gap-3"><h2 className="font-serif text-xl font-semibold">Recent surprises</h2><span className="text-xs text-[#748078]">Latest 100</span></div>
          <div className="mt-4 overflow-x-auto border-y border-[#dce2db]">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <thead><tr className="text-xs uppercase tracking-wide text-[#728279]"><th className="py-3 pr-4 font-medium">Recipient</th><th className="py-3 pr-4 font-medium">Created by</th><th className="py-3 pr-4 font-medium">Created</th><th className="py-3 font-medium">ID</th></tr></thead>
              <tbody>{surprises.map((surprise) => <tr className="border-t border-[#e5e9e3]" key={surprise.id}><td className="py-3 pr-4 font-medium">{surprise.recipient_name}</td><td className="py-3 pr-4">{surprise.sender_name}</td><td className="py-3 pr-4 text-[#68766f]">{new Date(surprise.created_at).toLocaleDateString()}</td><td className="py-3 font-mono text-xs text-[#68766f]">{surprise.id}</td></tr>)}</tbody>
            </table>
            {surprises.length === 0 && <p className="py-6 text-sm text-[#748078]">No surprises created yet.</p>}
          </div>
        </section>
        <p className="mt-8 text-xs text-[#748078]">Operational errors are available in the deployment logs.</p>
        {!errorsAvailable && <p className="sr-only">Error reporting is not connected.</p>}
      </div>
    </main>
  );
}
