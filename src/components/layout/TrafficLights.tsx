import { useState, useCallback } from 'react';

export function TrafficLights() {
  const [hovered, setHovered] = useState(false);

  const handleClose = useCallback(async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().close();
    } catch {}
  }, []);

  const handleMinimize = useCallback(async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().minimize();
    } catch {}
  }, []);

  const handleMaximize = useCallback(async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      getCurrentWindow().toggleMaximize();
    } catch {}
  }, []);

  return (
    <div
      className="flex items-center gap-2 titlebar-no-drag"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={handleClose}
        className="w-3 h-3 rounded-full bg-[#FF5F57] flex items-center justify-center transition-all hover:brightness-90 active:brightness-75"
      >
        {hovered && (
          <svg width="6" height="6" viewBox="0 0 6 6" className="text-[#4D0000]/90">
            <line x1="0.5" y1="0.5" x2="5.5" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="5.5" y1="0.5" x2="0.5" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <button
        onClick={handleMinimize}
        className="w-3 h-3 rounded-full bg-[#FEBC2E] flex items-center justify-center transition-all hover:brightness-90 active:brightness-75"
      >
        {hovered && (
          <svg width="6" height="2" viewBox="0 0 6 2" className="text-[#995700]/90">
            <line x1="0.5" y1="1" x2="5.5" y2="1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <button
        onClick={handleMaximize}
        className="w-3 h-3 rounded-full bg-[#28C840] flex items-center justify-center transition-all hover:brightness-90 active:brightness-75"
      >
        {hovered && (
          <svg width="6" height="6" viewBox="0 0 6 6" className="text-[#006500]/90">
            <polyline points="1,3.5 1,5 2.5,5" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="5,2.5 5,1 3.5,1" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
