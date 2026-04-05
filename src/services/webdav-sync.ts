import { webdavApi } from "@/services/tauri-api";
import { exportDatabase, importDatabase } from "@/services/database-backup";
import { useSettingsStore } from "@/stores/settings.store";

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

export interface WebDAVSyncOptions {
  includeImages?: boolean;
  incrementalSync?: boolean;
  encryptionPassword?: string;
}

interface SyncManifest {
  lastSyncAt: string;
  dataHash: string;
  promptCount: number;
  skillCount: number;
  version: number;
}

const REMOTE_DIR = "AgentForge";
const DATA_FILE = "backup.json";
const MANIFEST_FILE = "manifest.json";

let _lastLocalHash: string | null = null;
let _syncing = false;

function joinUrl(base: string, ...parts: string[]): string {
  let url = base.replace(/\/+$/, "");
  for (const part of parts) {
    url += "/" + part.replace(/^\/+/, "").replace(/\/+$/, "");
  }
  return url;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

async function encryptData(
  data: string,
  password: string,
): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(data),
  );
  const combined = new Uint8Array(
    salt.length + iv.length + new Uint8Array(encrypted).length,
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(
  encoded: string,
  password: string,
): Promise<string> {
  const raw = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const ciphertext = raw.slice(28);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}

export async function uploadToWebDAV(
  config: WebDAVConfig,
  options: WebDAVSyncOptions = {},
): Promise<{ success: boolean; message: string }> {
  if (_syncing) {
    return { success: false, message: "同步正在进行中" };
  }
  _syncing = true;

  try {
    const dirUrl = joinUrl(config.url, REMOTE_DIR);
    const ensureResult = await webdavApi.ensureDirectory(dirUrl, config);
    if (!ensureResult.success) {
      return {
        success: false,
        message: `创建远程目录失败: ${ensureResult.message || "Unknown error"}`,
      };
    }

    const backup = await exportDatabase({
      skipVideoContent: true,
    });

    if (!options.includeImages) {
      delete backup.images;
      delete backup.videos;
    }

    let dataStr = JSON.stringify(backup);

    if (options.incrementalSync) {
      const newHash = simpleHash(dataStr);
      if (_lastLocalHash && _lastLocalHash === newHash) {
        return { success: true, message: "数据无变化，跳过上传" };
      }
      _lastLocalHash = newHash;
    }

    if (options.encryptionPassword) {
      dataStr = await encryptData(dataStr, options.encryptionPassword);
    }

    const dataUrl = joinUrl(dirUrl, DATA_FILE);
    const uploadResult = await webdavApi.upload(dataUrl, config, dataStr);
    if (!uploadResult.success) {
      return {
        success: false,
        message: `上传失败: ${uploadResult.message || "Unknown error"}`,
      };
    }

    const manifest: SyncManifest = {
      lastSyncAt: new Date().toISOString(),
      dataHash: simpleHash(dataStr),
      promptCount: backup.prompts?.length ?? 0,
      skillCount: backup.skills?.length ?? 0,
      version: 1,
    };

    const manifestUrl = joinUrl(dirUrl, MANIFEST_FILE);
    await webdavApi.upload(manifestUrl, config, JSON.stringify(manifest));

    return {
      success: true,
      message: `同步成功！已上传 ${manifest.promptCount} 个 Prompts, ${manifest.skillCount} 个 Skills`,
    };
  } catch (error: any) {
    console.error("WebDAV upload error:", error);
    return {
      success: false,
      message: `上传异常: ${error?.message || String(error)}`,
    };
  } finally {
    _syncing = false;
  }
}

export async function downloadFromWebDAV(
  config: WebDAVConfig,
  options: WebDAVSyncOptions = {},
): Promise<{ success: boolean; message: string }> {
  if (_syncing) {
    return { success: false, message: "同步正在进行中" };
  }
  _syncing = true;

  try {
    const dirUrl = joinUrl(config.url, REMOTE_DIR);
    const dataUrl = joinUrl(dirUrl, DATA_FILE);

    const downloadResult = await webdavApi.download(dataUrl, config);
    if (!downloadResult.success || !downloadResult.data) {
      return {
        success: false,
        message: `下载失败: ${downloadResult.message || "远程无备份数据"}`,
      };
    }

    let dataStr = downloadResult.data;

    if (options.encryptionPassword) {
      try {
        dataStr = await decryptData(dataStr, options.encryptionPassword);
      } catch {
        return { success: false, message: "解密失败，请检查加密密码是否正确" };
      }
    }

    let backup;
    try {
      backup = JSON.parse(dataStr);
    } catch {
      return { success: false, message: "数据格式错误，无法解析备份文件" };
    }

    if (backup?.kind === "agentforge-backup") {
      backup = backup.payload;
    }

    await importDatabase(backup);

    const promptCount = backup.prompts?.length ?? 0;
    const skillCount = backup.skills?.length ?? 0;

    return {
      success: true,
      message: `恢复成功！已导入 ${promptCount} 个 Prompts, ${skillCount} 个 Skills`,
    };
  } catch (error: any) {
    console.error("WebDAV download error:", error);
    return {
      success: false,
      message: `下载异常: ${error?.message || String(error)}`,
    };
  } finally {
    _syncing = false;
  }
}

export async function checkRemoteStatus(
  config: WebDAVConfig,
): Promise<{ hasRemoteData: boolean; lastSyncAt?: string; manifest?: SyncManifest }> {
  try {
    const dirUrl = joinUrl(config.url, REMOTE_DIR);
    const manifestUrl = joinUrl(dirUrl, MANIFEST_FILE);

    const result = await webdavApi.download(manifestUrl, config);
    if (result.success && result.data) {
      const manifest = JSON.parse(result.data) as SyncManifest;
      return {
        hasRemoteData: true,
        lastSyncAt: manifest.lastSyncAt,
        manifest,
      };
    }
  } catch {
    // ignore
  }
  return { hasRemoteData: false };
}

export function getWebDAVConfig(): WebDAVConfig | null {
  const state = useSettingsStore.getState();
  if (
    !state.webdavEnabled ||
    !state.webdavUrl ||
    !state.webdavUsername ||
    !state.webdavPassword
  ) {
    return null;
  }
  return {
    url: state.webdavUrl,
    username: state.webdavUsername,
    password: state.webdavPassword,
  };
}

export function getWebDAVSyncOptions(): WebDAVSyncOptions {
  const state = useSettingsStore.getState();
  return {
    includeImages: state.webdavIncludeImages,
    incrementalSync: state.webdavIncrementalSync,
    encryptionPassword:
      state.webdavEncryptionEnabled && state.webdavEncryptionPassword
        ? state.webdavEncryptionPassword
        : undefined,
  };
}

export async function autoSync(): Promise<void> {
  const config = getWebDAVConfig();
  if (!config) return;
  const options = getWebDAVSyncOptions();
  const result = await uploadToWebDAV(config, options);
  if (!result.success && result.message !== "数据无变化，跳过上传" && result.message !== "同步正在进行中") {
    console.warn("[WebDAV AutoSync]", result.message);
  }
}

export function isSyncing(): boolean {
  return _syncing;
}
