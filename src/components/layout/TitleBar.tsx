import { MinusIcon, SquareIcon, XIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isWindows, setIsWindows] = useState(false);

  useEffect(() => {
    const platform = navigator.userAgent.toLowerCase();
    setIsWindows(platform.includes('win'));
  }, []);

  if (!isWindows) return null;

  const appWindow = getCurrentWindow();

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleMaximize = () => {
    appWindow.toggleMaximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    appWindow.close();
  };

  return (
    <div className="h-8 bg-background flex items-center justify-between select-none titlebar-drag border-b border-border" data-tauri-drag-region>
      <div className="flex items-center gap-2 px-3">
        <svg viewBox="0 0 512 512" className="w-4 h-4 rounded-[3px]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="tb-bg" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0%" stopColor="#0c0a1d"/><stop offset="100%" stopColor="#1a1530"/></linearGradient>
            <linearGradient id="tb-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient>
            <linearGradient id="tb-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fde68a"/><stop offset="100%" stopColor="#f59e0b"/></linearGradient>
          </defs>
          <rect width="512" height="512" rx="112" fill="url(#tb-bg)"/>
          <path d="M256 96 L148 404 L196 404 L224 316 L288 316 L316 404 L364 404 Z" fill="none" stroke="url(#tb-blue)" strokeWidth="12" strokeLinejoin="round" opacity="0.85"/>
          <path d="M280 128 L248 238 L280 238 L244 368" fill="none" stroke="url(#tb-gold)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
        </svg>
        <span className="text-xs text-muted-foreground">AgentForge</span>
      </div>

      <div className="flex h-full titlebar-no-drag">
        <button
          onClick={handleMinimize}
          className="w-11 h-full flex items-center justify-center hover:bg-muted transition-colors"
          title="最小化"
        >
          <MinusIcon className="w-4 h-4 text-foreground/70" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-full flex items-center justify-center hover:bg-muted transition-colors"
          title={isMaximized ? '还原' : '最大化'}
        >
          <SquareIcon className="w-3.5 h-3.5 text-foreground/70" />
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
          title="关闭"
        >
          <XIcon className="w-4 h-4 text-foreground/70 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
