import { createContext, useContext, useState, ReactNode } from 'react';

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastContextType {
  toasts: Toast[];
  toast: (options: Omit<Toast, 'id'>) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (options: Omit<Toast, 'id'>) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, ...options }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              marginBottom: 10,
              padding: '12px 20px',
              borderRadius: 8,
              background: t.variant === 'destructive' ? '#fee2e2' : '#f3f4f6',
              color: t.variant === 'destructive' ? '#b91c1c' : '#111827',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              minWidth: 220,
              fontWeight: 500,
            }}
          >
            <div>{t.title}</div>
            {t.description && <div style={{ fontSize: 13, color: '#6b7280' }}>{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
} 