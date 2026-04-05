import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/stores/settings.store";
import { autoSync } from "@/services/webdav-sync";

export function useWebDAVSync() {
  const webdavEnabled = useSettingsStore((s) => s.webdavEnabled);
  const webdavUrl = useSettingsStore((s) => s.webdavUrl);
  const webdavUsername = useSettingsStore((s) => s.webdavUsername);
  const webdavPassword = useSettingsStore((s) => s.webdavPassword);
  const syncOnStartup = useSettingsStore((s) => s.webdavSyncOnStartup);
  const syncOnStartupDelay = useSettingsStore((s) => s.webdavSyncOnStartupDelay);
  const autoSyncInterval = useSettingsStore((s) => s.webdavAutoSyncInterval);

  const hasConfig = webdavEnabled && webdavUrl && webdavUsername && webdavPassword;
  const startupDone = useRef(false);

  useEffect(() => {
    if (!hasConfig || !syncOnStartup || startupDone.current) return;
    startupDone.current = true;

    const delay = Math.max(0, syncOnStartupDelay) * 1000;
    const timer = setTimeout(() => {
      autoSync().catch((e) => console.warn("[WebDAV] Startup sync failed:", e));
    }, delay);

    return () => clearTimeout(timer);
  }, [hasConfig, syncOnStartup, syncOnStartupDelay]);

  useEffect(() => {
    if (!hasConfig || autoSyncInterval <= 0) return;

    const ms = autoSyncInterval * 60 * 1000;
    const timer = setInterval(() => {
      autoSync().catch((e) => console.warn("[WebDAV] Auto sync failed:", e));
    }, ms);

    return () => clearInterval(timer);
  }, [hasConfig, autoSyncInterval]);
}

let _saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function triggerSyncOnSave(): void {
  const state = useSettingsStore.getState();
  if (!state.webdavEnabled || !state.webdavSyncOnSave) return;
  if (!state.webdavUrl || !state.webdavUsername || !state.webdavPassword) return;

  if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
  _saveDebounceTimer = setTimeout(() => {
    _saveDebounceTimer = null;
    autoSync().catch((e) => console.warn("[WebDAV] Save sync failed:", e));
  }, 5000);
}
