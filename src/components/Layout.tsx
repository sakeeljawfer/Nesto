import { BarChart3, Boxes, Building2, CircleDollarSign, CreditCard, Gauge, Menu, PackageCheck, ReceiptText, Settings, ShieldCheck, Truck, Users, WalletCards, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from './ui';

export type PageKey = 'dashboard' | 'inventory' | 'customers' | 'invoices' | 'payments' | 'cash' | 'deliveries' | 'suppliers' | 'reports' | 'settings';

const nav: { key: PageKey; label: string; icon: ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <Gauge size={18} /> },
  { key: 'inventory', label: 'Inventory', icon: <Boxes size={18} /> },
  { key: 'customers', label: 'Customers', icon: <Users size={18} /> },
  { key: 'invoices', label: 'Invoices', icon: <ReceiptText size={18} /> },
  { key: 'payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { key: 'cash', label: 'Cash Flow', icon: <WalletCards size={18} /> },
  { key: 'deliveries', label: 'Deliveries', icon: <Truck size={18} /> },
  { key: 'suppliers', label: 'Suppliers', icon: <Building2 size={18} /> },
  { key: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={18} /> }
];

const pageSubtitles: Record<PageKey, string> = {
  dashboard: 'Today performance, credit reminders, and sales trend',
  inventory: 'Products, stock levels, reorder alerts, and stock movement',
  customers: 'Shop accounts, route details, balances, and reminders',
  invoices: 'Create, print, share, and track payment status',
  payments: 'Record collections and allocate invoice payments',
  cash: 'Daily cash in, expenses, and closing balance',
  deliveries: 'Routes, vehicles, drivers, and delivery outcomes',
  suppliers: 'Supplier payable tracking and contact records',
  reports: 'Sales, stock, profit, delivery, and cash exports',
  settings: 'Business profile, login, backup, and restore'
};

export const Layout = ({ page, setPage, children, onLogout }: { page: PageKey; setPage: (page: PageKey) => void; children: ReactNode; onLogout: () => void }) => {
  const [open, setOpen] = useState(false);
  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-5">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-600 text-white shadow-sm shadow-brand-600/30"><PackageCheck size={22} /></div>
        <div>
          <p className="text-base font-bold text-slate-950">Nesto Manager</p>
          <p className="text-xs text-slate-500">Water & beverages</p>
        </div>
      </div>
      <div className="mx-3 mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
        <div className="flex items-center gap-2 text-emerald-700"><ShieldCheck size={16} /><span className="text-xs font-bold uppercase">Local data</span></div>
        <p className="mt-1 text-xs leading-5 text-emerald-800">Works offline after installation. Backup regularly.</p>
      </div>
      <nav className="grid gap-1 p-3">
        {nav.map((item) => (
          <button key={item.key} onClick={() => { setPage(item.key); setOpen(false); }} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${page === item.key ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
            {item.icon}{item.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto border-t border-slate-200 p-3">
        <Button variant="secondary" className="w-full" onClick={onLogout}>Log out</Button>
        <p className="mt-3 text-center text-[11px] font-semibold text-slate-400">Powered by Axendigital Pvt Ltd</p>
      </div>
    </aside>
  );
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <div className="hidden lg:block">{sidebar}</div>
      {open && <div className="fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-slate-950/40" onClick={() => setOpen(false)} /><div className="relative h-full">{sidebar}<button className="absolute right-4 top-4 rounded-md bg-white p-2" onClick={() => setOpen(false)}><X size={18} /></button></div></div>}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="ghost" className="lg:hidden" onClick={() => setOpen(true)}><Menu size={18} /></Button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-slate-950">{nav.find((n) => n.key === page)?.label}</h1>
                <p className="truncate text-sm text-slate-500">{pageSubtitles[page]}</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><ShieldCheck size={14} />Offline ready</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"><CircleDollarSign size={14} />LKR</span>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1600px] p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
};
