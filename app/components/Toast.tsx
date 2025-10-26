'use client';

import { useEffect, useState } from 'react';
import { cx } from '@/lib/theme';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

type ToastItemProps = {
  toast: Toast;
  onDismiss: (id: string) => void;
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300); // Wait for animation
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const bgColor =
    toast.type === 'success'
      ? 'bg-[#79CBC4]/95 border-[#79CBC4]/60 text-[#0f223f]'
      : toast.type === 'error'
      ? 'bg-[#F289AE]/95 border-[#F289AE]/60 text-[#742348]'
      : 'bg-white/95 border-white/60 text-[#172F56]';

  return (
    <div
      role="alert"
      className={cx(
        'pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-xl backdrop-blur transition-all duration-300',
        bgColor,
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      )}
    >
      <div className="flex-1 text-sm font-semibold">{toast.message}</div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/10 transition"
        aria-label="Dismiss notification"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

type ToastContainerProps = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col gap-3 p-6 sm:max-w-md"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
