import { ReactNode, useEffect, useMemo, useState } from 'react';
import { XIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'fullscreen';
}

const SIZE_CONFIG = {
  sm: { maxWidth: '400px', height: 'auto', maxHeight: '85vh' },
  md: { maxWidth: '500px', height: 'auto', maxHeight: '85vh' },
  lg: { maxWidth: '600px', height: 'auto', maxHeight: '85vh' },
  xl: { maxWidth: '800px', height: 'auto', maxHeight: '85vh' },
  '2xl': { maxWidth: '1000px', height: 'auto', maxHeight: '85vh' },
  full: { maxWidth: '1200px', height: 'auto', maxHeight: '85vh' },
  fullscreen: { maxWidth: 'calc(100vw - 128px)', height: 'calc(100vh - 128px)', maxHeight: 'none' },
};

export function Modal({ isOpen, onClose, title, headerActions, children, size = 'md' }: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      return () => cancelAnimationFrame(rafId);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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

  if (!shouldRender) return null;

  const isFullscreen = size === 'fullscreen';
  const config = SIZE_CONFIG[size as keyof typeof SIZE_CONFIG] || SIZE_CONFIG.md;

  const modalContent = (
    <div
      className={clsx(
        'fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-200 ease-in-out',
        isFullscreen ? 'p-16' : 'p-4'
      )}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className={clsx(
          'absolute inset-0 glass-overlay transition-opacity duration-200',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />

      <div
        className={clsx(
          'relative glass-strong border border-border',
          'overflow-hidden flex flex-col rounded-2xl',
          'transition-all duration-200 ease-out',
          isAnimating 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        )}
        style={{ 
          margin: 'auto',
          width: '100%',
          maxWidth: config.maxWidth,
          height: isFullscreen ? config.height : 'auto',
          maxHeight: config.maxHeight,
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 relative z-10 bg-white/5">
            <div className="flex-1 min-w-0">
               <h2 className="text-xl font-bold tracking-tight text-foreground truncate">{title}</h2>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              {headerActions}
              <div className="w-[1px] h-4 bg-border mx-1" />
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
