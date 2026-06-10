import { useLiveQuery } from 'dexie-react-hooks';
import { LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Layout, type PageKey } from './components/Layout';
import { ToastProvider, useToast } from './components/Toast';
import { Button, Card, Field, inputClass } from './components/ui';
import { hashPassword } from './lib/auth';
import { db, resetLoginCredentials } from './lib/db';
import { CashFlow } from './modules/CashFlow';
import { Customers } from './modules/Customers';
import { Dashboard } from './modules/Dashboard';
import { Deliveries } from './modules/Deliveries';
import { Inventory } from './modules/Inventory';
import { Invoices } from './modules/Invoices';
import { Payments } from './modules/Payments';
import { Reports } from './modules/Reports';
import { Settings } from './modules/Settings';
import { Suppliers } from './modules/Suppliers';

export const App = () => {
  const [session, setSession] = useState(() => localStorage.getItem('nesto-session') === 'active');
  const [page, setPage] = useState<PageKey>('dashboard');
  const logout = () => { localStorage.removeItem('nesto-session'); setSession(false); };
  return <ToastProvider>{session ? <Layout page={page} setPage={setPage} onLogout={logout}>{page === 'dashboard' && <Dashboard setPage={setPage} />}{page === 'inventory' && <Inventory />}{page === 'customers' && <Customers />}{page === 'invoices' && <Invoices />}{page === 'payments' && <Payments />}{page === 'cash' && <CashFlow />}{page === 'deliveries' && <Deliveries />}{page === 'suppliers' && <Suppliers />}{page === 'reports' && <Reports />}{page === 'settings' && <Settings onLogout={logout} />}</Layout> : <Login onLogin={() => setSession(true)} />}</ToastProvider>;
};

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const settings = useLiveQuery(() => db.settings.get('default'), []);
  const [userName, setUserName] = useState('admin');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  useEffect(() => { if (settings?.userName) setUserName(settings.userName); }, [settings?.userName]);
  const login = async () => {
    try {
      setBusy(true);
      setStatus('Checking login...');
      const cleanUserName = userName.trim();
      const cleanPassword = password.trim();
      if (!settings && cleanUserName === 'admin' && cleanPassword === 'admin123') {
        await resetLoginCredentials();
        localStorage.setItem('nesto-session', 'active');
        onLogin();
        return;
      }
      if (!settings) {
        setStatus('Login setup is still loading. Try again in a moment.');
        notify('Login setup is still loading. Try again in a moment.');
        return;
      }
      const hash = await hashPassword(cleanPassword, settings.salt);
      if (cleanUserName === settings.userName && hash === settings.passwordHash) {
        localStorage.setItem('nesto-session', 'active');
        onLogin();
        return;
      }
      if (cleanUserName === 'admin' && cleanPassword === 'admin123') {
        await resetLoginCredentials();
        localStorage.setItem('nesto-session', 'active');
        onLogin();
        notify('Login repaired and opened');
        return;
      }
      setStatus(`Invalid login. Current user is "${settings.userName}".`);
      notify('Invalid user name or password');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown login error';
      setStatus(`Login error: ${message}`);
      notify('Login error. See message on screen.');
    } finally {
      setBusy(false);
    }
  };
  const resetLogin = async () => {
    if (!confirm('Reset login credentials? Your business data will remain unchanged.')) return;
    setBusy(true);
    await resetLoginCredentials();
    setUserName('admin');
    setPassword('');
    setStatus('Login reset. Use the default credentials and press Log in.');
    setBusy(false);
    notify('Login reset to admin / admin123');
  };
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4"><Card className="w-full max-w-md"><div className="mb-6 grid justify-items-center gap-3 text-center"><div className="grid h-14 w-14 place-items-center rounded-lg bg-brand-600 text-white"><LockKeyhole size={24} /></div><div><h1 className="text-2xl font-bold text-slate-950">{settings?.businessName ?? 'Nesto Distribution Manager'}</h1><p className="text-sm text-slate-500">Secure local login for offline use</p></div></div><form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); login(); }}><Field label="User name"><input className={inputClass} value={userName} onChange={(e) => setUserName(e.target.value)} /></Field><Field label="Password"><input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus /></Field><Button type="submit" className="w-full" disabled={busy}>{busy ? 'Checking...' : 'Log in'}</Button><Button type="button" variant="secondary" className="w-full" onClick={resetLogin} disabled={busy}>Reset login only</Button>{status && <p className="rounded-md bg-slate-50 p-3 text-center text-xs font-medium text-slate-600">{status}</p>}</form></Card></main>;
};
