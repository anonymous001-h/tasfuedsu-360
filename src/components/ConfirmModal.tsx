import type { ReactNode } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  icon?: ReactNode;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
  icon,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-dark-surface rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {icon && (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 ${danger ? 'bg-red-50 dark:bg-red-900/30 text-red-500' : 'bg-brand-100 dark:bg-brand-900/30 text-brand-600'}`}>
            {icon}
          </div>
        )}
        <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-dark-muted text-center leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-dark-surface2 text-gray-700 dark:text-dark-muted font-bold text-sm active:scale-95 transition-transform"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-white font-bold text-sm active:scale-95 transition-transform ${
              danger ? 'bg-red-500' : 'bg-gradient-to-r from-brand-600 to-brand-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
