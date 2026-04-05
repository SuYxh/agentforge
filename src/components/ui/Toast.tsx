import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, XCircleIcon, InfoIcon, AlertTriangleIcon, XIcon } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, sendSystemNotification?: boolean) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const enableNotifications = useSettingsStore((state) => state.enableNotifications);

  const showToast = useCallback(async (message: string, type: ToastType = 'success', sendSystemNotification = false) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    if (sendSystemNotification && enableNotifications) {
      try {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          const permission = await requestPermission();
          permissionGranted = permission === 'granted';
        }
        if (permissionGranted) {
          const title = type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info';
          sendNotification({ title: `AgentForge - ${title}`, body: message });
        }
      } catch {
        // Notification not available
      }
    }
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, [enableNotifications]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <InfoIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 dark:bg-green-400/10 border-green-400/20 dark:border-green-400/15';
      case 'error':
        return 'bg-red-500/10 dark:bg-red-400/10 border-red-400/20 dark:border-red-400/15';
      case 'warning':
        return 'bg-yellow-500/10 dark:bg-yellow-400/10 border-yellow-400/20 dark:border-yellow-400/15';
      case 'info':
      default:
        return 'bg-blue-500/10 dark:bg-blue-400/10 border-blue-400/20 dark:border-blue-400/15';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`
                flex items-center gap-3 px-5 py-3.5 glass-strong rounded-2xl pointer-events-auto
                animate-in slide-in-from-right-10 fade-in duration-300
                ${getBgColor(toast.type)}
              `}
            >
              {getIcon(toast.type)}
              <span className="text-sm font-semibold text-foreground">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                title={t('common.close') || 'Close'}
              >
                <XIcon className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
