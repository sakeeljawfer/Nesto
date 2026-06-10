import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) => {
  const styles = {
    primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700',
    secondary: 'border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700',
    ghost: 'text-slate-700 hover:bg-slate-100'
  };
  return <button className={`inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{children}</button>;
};

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-lg border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/70 sm:p-4 ${className}`}>{children}</section>
);

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="grid min-w-0 gap-1 text-sm font-medium text-slate-700">
    <span>{label}</span>
    {children}
  </label>
);

export const inputClass = 'min-h-10 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-600/20 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-600 focus:ring-4';

export const Badge = ({ children, tone = 'slate' }: { children: ReactNode; tone?: 'green' | 'amber' | 'red' | 'blue' | 'slate' }) => {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-sky-50 text-sky-700 ring-sky-200',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200'
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[tone]}`}>{children}</span>;
};

export const Modal = ({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-0 sm:place-items-center sm:p-4">
    <div className="max-h-[94dvh] w-full overflow-auto rounded-t-lg bg-white shadow-soft sm:max-w-3xl sm:rounded-lg">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="min-w-0 truncate text-base font-bold text-slate-950 sm:text-lg">{title}</h2>
        <Button variant="ghost" className="h-9 w-9 p-0" onClick={onClose} aria-label="Close"><X size={18} /></Button>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  </div>
);

export const EmptyState = ({ title, action }: { title: string; action?: ReactNode }) => (
  <div className="grid place-items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-slate-600 sm:p-8">
    <p className="font-semibold">{title}</p>
    {action}
  </div>
);

export const TableShell = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
    <div className="overflow-x-auto overscroll-x-contain">{children}</div>
  </div>
);

export const th = 'whitespace-nowrap bg-slate-50 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-3';
export const td = 'whitespace-nowrap border-t border-slate-100 px-3 py-2.5 text-sm text-slate-700 sm:px-4 sm:py-3';

export const SectionTitle = ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (
  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="font-bold text-slate-950">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);
