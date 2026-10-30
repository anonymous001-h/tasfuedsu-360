import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_STYLES: Record<ToastType, { bg: string; icon: ReactNode; accent: string }> = {
  success: {
    bg: 'bg-white dark:bg-dark-surface',
    accent: 'border-l-4 border-emerald-500',
    icon: <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" />,
  },
  error: {
    bg: 'bg-white dark:bg-dark-surface',
    accent: 'border-l-4 border-red-500',
    icon: <XCircle className="text-red-500 w-5 h-5 flex-shrink-0" />,
  },
  info: {
    bg: 'bg-white dark:bg-dark-surface',
    accent: 'border-l-4 border-brand-500',
    icon: <Info className="text-brand-500 w-5 h-5 flex-shrink-0" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, message, type, exiting: false }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 pointer-events-none w-[92%] max-w-[400px]">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className={`${style.bg} ${style.accent} rounded-xl shadow-2xl px-4 py-3.5 flex items-center gap-3 pointer-events-auto ${toast.exiting ? 'animate-toast-out' : 'animate-toast-in'}`}
            >
              {style.icon}
              <p className="text-sm font-medium text-gray-800 dark:text-dark-text leading-snug flex-1">{toast.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
