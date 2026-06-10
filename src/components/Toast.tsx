import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastContextValue = { notify: (message: string) => void };
const ToastContext = createContext<ToastContextValue>({ notify: () => undefined });

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState('');
  const value = useMemo(() => ({
    notify: (next: string) => {
      setMessage(next);
      window.setTimeout(() => setMessage(''), 2600);
    }
  }), []);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {message && <div className="fixed bottom-5 right-5 z-[60] rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-soft">{message}</div>}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
