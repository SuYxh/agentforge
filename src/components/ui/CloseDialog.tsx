import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { XIcon, MinusIcon, LogOutIcon } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Checkbox } from './Checkbox';

interface CloseDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloseDialog({ isOpen, onClose }: CloseDialogProps) {
  const { t } = useTranslation();
  const [rememberChoice, setRememberChoice] = useState(false);
  const setCloseAction = useSettingsStore((state) => state.setCloseAction);

  useEffect(() => {
    if (isOpen) {
      setRememberChoice(false);
    }
  }, [isOpen]);

  const handleCancel = () => {
    onClose();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleMinimize = () => {
    if (rememberChoice) {
      setCloseAction('minimize');
    }
    getCurrentWindow().minimize();
    onClose();
  };

  const handleExit = () => {
    if (rememberChoice) {
      setCloseAction('exit');
    }
    getCurrentWindow().close();
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="absolute inset-0 glass-overlay"
        onClick={handleCancel}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <div className="relative glass-strong rounded-2xl overflow-hidden w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {t('closeDialog.title')}
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 -mr-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-muted-foreground text-sm">
            {t('closeDialog.message')}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleMinimize}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/15 dark:border-white/8 hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-glass-sm transition-all group"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <MinusIcon className="w-5 h-5" />
              </div>
              <span className="font-medium text-foreground">
                {t('closeDialog.minimizeToTray')}
              </span>
            </button>

            <button
              onClick={handleExit}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/15 dark:border-white/8 hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-glass-sm transition-all group"
            >
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
                <LogOutIcon className="w-5 h-5" />
              </div>
              <span className="font-medium text-foreground">
                {t('closeDialog.exitApp')}
              </span>
            </button>
          </div>

          <div className="flex items-center">
            <Checkbox
              checked={rememberChoice}
              onChange={setRememberChoice}
              label={t('closeDialog.rememberChoice')}
              className="text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
