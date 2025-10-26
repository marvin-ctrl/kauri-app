'use client';

import { useEffect, useRef } from 'react';
import { cx, dangerActionButton, secondaryActionButton } from '@/lib/theme';

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger'
}: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Focus the dialog for accessibility
      dialogRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f3b]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="brand-card w-full max-w-md space-y-6 p-6 sm:p-8 animate-in zoom-in-95 duration-200"
      >
        <div className="space-y-3">
          <h2 id="modal-title" className="text-2xl font-bold text-[#172F56]">
            {title}
          </h2>
          <p id="modal-description" className="text-sm text-[#415572]">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cx(
              variant === 'danger' ? dangerActionButton : 'inline-flex items-center justify-center rounded-full bg-[#79CBC4] px-4 py-2 text-sm font-semibold text-[#0f223f] shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#68b8b0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F289AE] focus-visible:ring-offset-2 focus-visible:ring-offset-white',
              'w-full sm:w-auto'
            )}
            autoFocus
          >
            {confirmLabel}
          </button>
          <button onClick={onClose} className={cx(secondaryActionButton, 'w-full sm:w-auto')}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
