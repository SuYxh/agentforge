import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangleIcon } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 glass-overlay"
        onClick={onClose}
      />

      <div className="relative glass-strong rounded-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        {variant === 'destructive' && (
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        )}

        {title && (
          <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>
        )}

        <div className="text-sm text-muted-foreground text-center mb-6">
          {message}
        </div>

        <div className="flex gap-3">
          <button
            ref={cancelButtonRef}
            onClick={onClose}
            className="flex-1 h-10 px-4 rounded-lg bg-white/20 dark:bg-white/8 border border-white/15 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/12 backdrop-blur-sm transition-colors text-sm font-medium"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`flex-1 h-10 px-4 rounded-lg text-white text-sm font-medium transition-colors ${
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
