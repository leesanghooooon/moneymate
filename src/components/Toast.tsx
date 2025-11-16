'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import styles from '../styles/css/Toast.module.css';

type ToastType = 'info' | 'success' | 'error';

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
  durationMs?: number;
};

type ToastContextValue = {
  show: (message: string, options?: { type?: ToastType; durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, options?: { type?: ToastType; durationMs?: number }) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const type: ToastType = options?.type ?? 'info';
    const durationMs = options?.durationMs ?? 2200;
    const toast: ToastItem = { id, message, type, durationMs };
    setToasts(prev => [...prev, toast]);
    // 자동 제거
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastContainer} aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}


