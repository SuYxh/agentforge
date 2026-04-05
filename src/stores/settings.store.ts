import { create } from "zustand";
import { persist } from "zustand/middleware";
import { changeLanguage } from "@/i18n";

const SUPPORTED_LANGUAGES = [
  "zh",
  "en",
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const normalizeLanguage = (lang: string): SupportedLanguage => {
  if (SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)) {
    return lang as SupportedLanguage;
  }
  const lower = (lang || "").toLowerCase();
  if (lower.startsWith("zh")) return "zh";
  return "en";
};

const getDefaultDataPath = (): string => {
  const platform = navigator.userAgent.toLowerCase();
  if (platform.includes("win")) {
    return "%APPDATA%/AgentForge";
  } else if (platform.includes("mac")) {
    return "~/Library/Application Support/AgentForge";
  } else {
    return "~/.config/AgentForge";
  }
};

export const MORANDI_THEMES = [
  { id: "blue", hue: 211, saturation: 100, name: "Apple Blue" },
  { id: "purple", hue: 270, saturation: 80, name: "Indigo" },
  { id: "green", hue: 142, saturation: 70, name: "Emerald" },
  { id: "orange", hue: 25, saturation: 95, name: "Tangerine" },
  { id: "teal", hue: 175, saturation: 70, name: "Teal" },
  { id: "pink", hue: 340, saturation: 80, name: "Rose" },
];

export const FONT_SIZES = [
  { id: "small", value: 14, name: "Small" },
  { id: "medium", value: 16, name: "Medium" },
  { id: "large", value: 18, name: "Large" },
];

const DEFAULT_TAGS_SECTION_HEIGHT = 140;

type Hs = { hue: number; saturation: number };

const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

const hexToHs = (hex: string): Hs => {
  const normalized = (hex || "").trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    hue: clamp(h, 0, 360),
    saturation: clamp(Math.round(s * 100), 0, 100),
  };
};

export type ThemeMode = "light" | "dark" | "system";

export type AIModelType = "chat" | "image";

export interface ChatModelParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  enableThinking?: boolean;
  customParams?: Record<string, string | number | boolean>;
}

export interface ImageModelParams {
  size?: string;
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  n?: number;
}

export interface AIModelConfig {
  id: string;
  type: AIModelType;
  name?: string;
  provider: string;
  apiKey: string;
  apiUrl: string;
  model: string;
  isDefault?: boolean;
  chatParams?: ChatModelParams;
  imageParams?: ImageModelParams;
}

export type CreationMode = "manual" | "quick";

interface SettingsState {
  creationMode: CreationMode;

  themeMode: ThemeMode;
  isDarkMode: boolean;
  themeColor: string;
  themeHue: number;
  themeSaturation: number;
  customThemeHex: string;
  settingsUpdatedAt: string;
  fontSize: string;
  renderMarkdown: boolean;
  editorMarkdownPreview: boolean;

  autoSave: boolean;
  showLineNumbers: boolean;
  minimizeOnLaunch: boolean;
  debugMode: boolean;

  closeAction: "ask" | "minimize" | "exit";

  shortcutModes: Record<string, "global" | "local">;

  enableNotifications: boolean;
  showCopyNotification: boolean;
  showSaveNotification: boolean;

  language: SupportedLanguage;

  dataPath: string;

  webdavEnabled: boolean;
  webdavUrl: string;
  webdavUsername: string;
  webdavPassword: string;
  webdavAutoSync: boolean;
  webdavSyncOnStartup: boolean;
  webdavSyncOnStartupDelay: number;
  webdavAutoSyncInterval: number;
  webdavSyncOnSave: boolean;
  webdavIncludeImages: boolean;
  webdavIncrementalSync: boolean;
  webdavEncryptionEnabled: boolean;
  webdavEncryptionPassword: string;

  autoCheckUpdate: boolean;
  useUpdateMirror: boolean;

  tagsSectionHeight: number;
  isTagsSectionCollapsed: boolean;
  skillTagsSectionHeight: number;
  isSkillTagsSectionCollapsed: boolean;

  aiProvider: string;
  aiApiKey: string;
  aiApiUrl: string;
  aiModel: string;

  aiModels: AIModelConfig[];

  sourceHistory: string[];

  customSkillScanPaths: string[];

  customSkillPlatformPaths: Record<string, string>;

  skillInstallMethod: "symlink" | "copy";

  setThemeMode: (mode: ThemeMode) => void;
  setDarkMode: (isDark: boolean) => void;
  setThemeColor: (colorId: string) => void;
  setCustomThemeHex: (hex: string) => void;
  setFontSize: (size: string) => void;
  setRenderMarkdown: (enabled: boolean) => void;
  setEditorMarkdownPreview: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setShowLineNumbers: (enabled: boolean) => void;
  setMinimizeOnLaunch: (enabled: boolean) => void;
  setDebugMode: (enabled: boolean) => void;
  setEnableNotifications: (enabled: boolean) => void;
  setCloseAction: (action: "ask" | "minimize" | "exit") => void;
  setShortcutMode: (key: string, mode: "global" | "local") => void;
  setShowCopyNotification: (enabled: boolean) => void;
  setShowSaveNotification: (enabled: boolean) => void;
  setLanguage: (lang: string) => void;
  setDataPath: (path: string) => void;
  setWebdavEnabled: (enabled: boolean) => void;
  setWebdavUrl: (url: string) => void;
  setWebdavUsername: (username: string) => void;
  setWebdavPassword: (password: string) => void;
  setWebdavAutoSync: (enabled: boolean) => void;
  setWebdavSyncOnStartup: (enabled: boolean) => void;
  setWebdavSyncOnStartupDelay: (delay: number) => void;
  setWebdavAutoSyncInterval: (interval: number) => void;
  setWebdavSyncOnSave: (enabled: boolean) => void;
  setWebdavIncludeImages: (enabled: boolean) => void;
  setWebdavIncrementalSync: (enabled: boolean) => void;
  setWebdavEncryptionEnabled: (enabled: boolean) => void;
  setWebdavEncryptionPassword: (password: string) => void;
  setAutoCheckUpdate: (enabled: boolean) => void;
  setUseUpdateMirror: (enabled: boolean) => void;
  setTagsSectionHeight: (height: number) => void;
  setIsTagsSectionCollapsed: (collapsed: boolean) => void;
  setSkillTagsSectionHeight: (height: number) => void;
  setIsSkillTagsSectionCollapsed: (collapsed: boolean) => void;
  setAiProvider: (provider: string) => void;
  setAiApiKey: (key: string) => void;
  setAiApiUrl: (url: string) => void;
  setAiModel: (model: string) => void;
  addAiModel: (config: Omit<AIModelConfig, "id">) => void;
  updateAiModel: (id: string, config: Partial<AIModelConfig>) => void;
  deleteAiModel: (id: string) => void;
  setDefaultAiModel: (id: string) => void;
  setCreationMode: (mode: CreationMode) => void;
  addSourceHistory: (source: string) => void;
  applyTheme: () => void;
  setCustomSkillScanPaths: (paths: string[]) => void;
  addCustomSkillScanPath: (path: string) => void;
  removeCustomSkillScanPath: (path: string) => void;
  setCustomSkillPlatformPath: (platformId: string, path: string) => void;
  resetCustomSkillPlatformPath: (platformId: string) => void;
  setSkillInstallMethod: (method: "symlink" | "copy") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => {
      const touch = (): string => new Date().toISOString();
      const setTouched = (partial: Partial<SettingsState>) =>
        set({ ...partial, settingsUpdatedAt: touch() } as SettingsState);

      return {
        themeMode: "system" as ThemeMode,
        isDarkMode: true,
        themeColor: "blue",
        themeHue: 211,
        themeSaturation: 100,
        customThemeHex: "#007AFF",
        settingsUpdatedAt: new Date().toISOString(),
        fontSize: "medium",
        renderMarkdown: true,
        editorMarkdownPreview: false,
        autoSave: true,
        showLineNumbers: false,
        minimizeOnLaunch: true,
        debugMode: false,
        closeAction: "ask" as const,
        shortcutModes: {
          showApp: "global",
          newPrompt: "local",
          search: "local",
          settings: "local",
        },
        enableNotifications: true,
        showCopyNotification: true,
        showSaveNotification: true,
        language: normalizeLanguage(navigator.language || "en"),
        dataPath: getDefaultDataPath(),
        webdavEnabled: false,
        webdavUrl: "",
        webdavUsername: "",
        webdavPassword: "",
        webdavAutoSync: false,
        webdavSyncOnStartup: true,
        webdavSyncOnStartupDelay: 10,
        webdavAutoSyncInterval: 0,
        webdavSyncOnSave: false,
        webdavIncludeImages: true,
        webdavIncrementalSync: true,
        webdavEncryptionEnabled: false,
        webdavEncryptionPassword: "",
        autoCheckUpdate: true,
        useUpdateMirror: false,
        tagsSectionHeight: DEFAULT_TAGS_SECTION_HEIGHT,
        isTagsSectionCollapsed: false,
        skillTagsSectionHeight: DEFAULT_TAGS_SECTION_HEIGHT,
        isSkillTagsSectionCollapsed: false,
        aiProvider: "openai",
        aiApiKey: "",
        aiApiUrl: "",
        aiModel: "gpt-4o",
        aiModels: [],
        creationMode: "manual" as CreationMode,
        sourceHistory: [],
        customSkillScanPaths: [],
        customSkillPlatformPaths: {},
        skillInstallMethod: "symlink" as const,

        setCreationMode: (mode) => setTouched({ creationMode: mode }),

        addSourceHistory: (source) => {
          if (!source.trim()) return;
          const history = get().sourceHistory;
          const filtered = history.filter((s) => s !== source.trim());
          const updated = [source.trim(), ...filtered].slice(0, 20);
          setTouched({ sourceHistory: updated });
        },

        setThemeMode: (mode) => {
          setTouched({ themeMode: mode });
          if (mode === "system") {
            const prefersDark = window.matchMedia(
              "(prefers-color-scheme: dark)",
            ).matches;
            setTouched({ isDarkMode: prefersDark });
            document.documentElement.classList.toggle("dark", prefersDark);
          } else {
            const isDark = mode === "dark";
            setTouched({ isDarkMode: isDark });
            document.documentElement.classList.toggle("dark", isDark);
          }
        },

        setDarkMode: (isDark) => {
          setTouched({
            isDarkMode: isDark,
            themeMode: isDark ? "dark" : "light",
          });
          document.documentElement.classList.toggle("dark", isDark);
        },

        setThemeColor: (colorId) => {
          if (colorId === "custom") {
            const state = get();
            const hs = hexToHs(state.customThemeHex);
            setTouched({
              themeColor: "custom",
              themeHue: hs.hue,
              themeSaturation: hs.saturation,
            });
            document.documentElement.style.setProperty(
              "--theme-hue",
              String(hs.hue),
            );
            document.documentElement.style.setProperty(
              "--theme-saturation",
              String(hs.saturation),
            );
            return;
          }
          const theme = MORANDI_THEMES.find((t) => t.id === colorId);
          if (theme) {
            setTouched({
              themeColor: colorId,
              themeHue: theme.hue,
              themeSaturation: theme.saturation,
            });
            document.documentElement.style.setProperty(
              "--theme-hue",
              String(theme.hue),
            );
            document.documentElement.style.setProperty(
              "--theme-saturation",
              String(theme.saturation),
            );
          }
        },
        setCustomThemeHex: (hex) => {
          const hs = hexToHs(hex);
          setTouched({
            customThemeHex: `#${hex.replace(/^#/, "")}`,
            themeColor: "custom",
            themeHue: hs.hue,
            themeSaturation: hs.saturation,
          });
          document.documentElement.style.setProperty(
            "--theme-hue",
            String(hs.hue),
          );
          document.documentElement.style.setProperty(
            "--theme-saturation",
            String(hs.saturation),
          );
        },
        setRenderMarkdown: (enabled) => setTouched({ renderMarkdown: enabled }),
        setEditorMarkdownPreview: (enabled) =>
          setTouched({ editorMarkdownPreview: enabled }),

        setFontSize: (size) => {
          setTouched({ fontSize: size });
          const fontConfig = FONT_SIZES.find((f) => f.id === size);
          if (fontConfig) {
            document.documentElement.style.setProperty(
              "--base-font-size",
              `${fontConfig.value}px`,
            );
          }
        },

        setAutoSave: (enabled) => setTouched({ autoSave: enabled }),
        setShowLineNumbers: (enabled) =>
          setTouched({ showLineNumbers: enabled }),
        setMinimizeOnLaunch: (enabled) => {
          setTouched({ minimizeOnLaunch: enabled });
        },
        setCloseAction: (action) => {
          setTouched({ closeAction: action });
        },
        setDebugMode: (enabled) => {
          setTouched({ debugMode: enabled });
        },
        setShortcutMode: (key, mode) => {
          const currentModes = get().shortcutModes || {};
          const newModes = { ...currentModes, [key]: mode };
          setTouched({ shortcutModes: newModes });
        },
        setEnableNotifications: (enabled) =>
          setTouched({ enableNotifications: enabled }),
        setShowCopyNotification: (enabled) =>
          setTouched({ showCopyNotification: enabled }),
        setShowSaveNotification: (enabled) =>
          setTouched({ showSaveNotification: enabled }),
        setLanguage: (lang) => {
          const normalized = normalizeLanguage(lang);
          setTouched({ language: normalized });
          changeLanguage(normalized);
        },
        setDataPath: (path) => setTouched({ dataPath: path }),
        setWebdavEnabled: (enabled) => setTouched({ webdavEnabled: enabled }),
        setWebdavUrl: (url) => setTouched({ webdavUrl: url }),
        setWebdavUsername: (username) =>
          setTouched({ webdavUsername: username }),
        setWebdavPassword: (password) =>
          setTouched({ webdavPassword: password }),
        setWebdavAutoSync: (enabled) =>
          setTouched({ webdavAutoSync: enabled, webdavSyncOnStartup: enabled }),
        setWebdavSyncOnStartup: (enabled) =>
          setTouched({ webdavSyncOnStartup: enabled }),
        setWebdavSyncOnStartupDelay: (delay) =>
          setTouched({
            webdavSyncOnStartupDelay: Math.max(0, Math.min(60, delay)),
          }),
        setWebdavAutoSyncInterval: (interval) =>
          setTouched({ webdavAutoSyncInterval: Math.max(0, interval) }),
        setWebdavSyncOnSave: (enabled) =>
          setTouched({ webdavSyncOnSave: enabled }),
        setWebdavIncludeImages: (enabled) =>
          setTouched({ webdavIncludeImages: enabled }),
        setWebdavIncrementalSync: (enabled) =>
          setTouched({ webdavIncrementalSync: enabled }),
        setWebdavEncryptionEnabled: (enabled) =>
          setTouched({ webdavEncryptionEnabled: enabled }),
        setWebdavEncryptionPassword: (password) =>
          setTouched({ webdavEncryptionPassword: password }),
        setAutoCheckUpdate: (enabled) =>
          setTouched({ autoCheckUpdate: enabled }),
        setUseUpdateMirror: (enabled) =>
          setTouched({ useUpdateMirror: enabled }),
        setTagsSectionHeight: (height) =>
          setTouched({ tagsSectionHeight: height }),
        setIsTagsSectionCollapsed: (collapsed) =>
          setTouched({ isTagsSectionCollapsed: collapsed }),
        setSkillTagsSectionHeight: (height) =>
          setTouched({ skillTagsSectionHeight: height }),
        setIsSkillTagsSectionCollapsed: (collapsed) =>
          setTouched({ isSkillTagsSectionCollapsed: collapsed }),
        setAiProvider: (provider) => setTouched({ aiProvider: provider }),
        setAiApiKey: (key) => setTouched({ aiApiKey: key }),
        setAiApiUrl: (url) => setTouched({ aiApiUrl: url }),
        setAiModel: (model) => setTouched({ aiModel: model }),

        addAiModel: (config) => {
          const id = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const models = get().aiModels;
          const isFirst = models.length === 0;
          setTouched({
            aiModels: [...models, { ...config, id, isDefault: isFirst }],
          });
          if (isFirst) {
            setTouched({
              aiProvider: config.provider,
              aiApiKey: config.apiKey,
              aiApiUrl: config.apiUrl,
              aiModel: config.model,
            });
          }
        },

        updateAiModel: (id, config) => {
          const models = get().aiModels.map((m) =>
            m.id === id ? { ...m, ...config } : m,
          );
          setTouched({ aiModels: models });
          const updated = models.find((m) => m.id === id);
          if (updated?.isDefault) {
            setTouched({
              aiProvider: updated.provider,
              aiApiKey: updated.apiKey,
              aiApiUrl: updated.apiUrl,
              aiModel: updated.model,
            });
          }
        },

        deleteAiModel: (id) => {
          const models = get().aiModels;
          const toDelete = models.find((m) => m.id === id);
          const remaining = models.filter((m) => m.id !== id);
          if (toDelete?.isDefault && remaining.length > 0) {
            remaining[0].isDefault = true;
            setTouched({
              aiProvider: remaining[0].provider,
              aiApiKey: remaining[0].apiKey,
              aiApiUrl: remaining[0].apiUrl,
              aiModel: remaining[0].model,
            });
          }
          setTouched({ aiModels: remaining });
        },

        setDefaultAiModel: (id) => {
          const targetModel = get().aiModels.find((m) => m.id === id);
          if (!targetModel) return;

          const targetType = targetModel.type || "chat";

          const models = get().aiModels.map((m) => {
            const modelType = m.type || "chat";
            if (modelType === targetType) {
              return { ...m, isDefault: m.id === id };
            }
            return m;
          });
          setTouched({ aiModels: models });

          if (targetType === "chat") {
            setTouched({
              aiProvider: targetModel.provider,
              aiApiKey: targetModel.apiKey,
              aiApiUrl: targetModel.apiUrl,
              aiModel: targetModel.model,
            });
          }
        },

        applyTheme: () => {
          const state = get();
          let isDark = state.isDarkMode;
          if (state.themeMode === "system") {
            isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          } else {
            isDark = state.themeMode === "dark";
          }
          document.documentElement.classList.toggle("dark", isDark);
          document.documentElement.style.setProperty(
            "--theme-hue",
            String(state.themeHue),
          );
          document.documentElement.style.setProperty(
            "--theme-saturation",
            String(state.themeSaturation),
          );
          const fontConfig = FONT_SIZES.find((f) => f.id === state.fontSize);
          if (fontConfig) {
            document.documentElement.style.setProperty(
              "--base-font-size",
              `${fontConfig.value}px`,
            );
          }
        },

        setCustomSkillScanPaths: (paths) =>
          setTouched({ customSkillScanPaths: paths }),
        addCustomSkillScanPath: (path) =>
          setTouched({
            customSkillScanPaths: get().customSkillScanPaths.includes(path)
              ? get().customSkillScanPaths
              : [...get().customSkillScanPaths, path],
          }),
        removeCustomSkillScanPath: (path) =>
          setTouched({
            customSkillScanPaths: get().customSkillScanPaths.filter(
              (p) => p !== path,
            ),
          }),
        setCustomSkillPlatformPath: (platformId, pathValue) => {
          const normalizedPath = pathValue.trim();
          const nextPaths = { ...get().customSkillPlatformPaths };
          if (normalizedPath) {
            nextPaths[platformId] = normalizedPath;
          } else {
            delete nextPaths[platformId];
          }
          setTouched({ customSkillPlatformPaths: nextPaths });
        },
        resetCustomSkillPlatformPath: (platformId) => {
          const nextPaths = { ...get().customSkillPlatformPaths };
          delete nextPaths[platformId];
          setTouched({ customSkillPlatformPaths: nextPaths });
        },
        setSkillInstallMethod: (method) =>
          setTouched({ skillInstallMethod: method }),
      };
    },
    {
      name: "agentforge-settings",
      version: 2,
      migrate: (state) => {
        if (!state || typeof state !== "object") {
          return state as SettingsState;
        }
        const next = { ...(state as SettingsState) };
        if (
          typeof next.tagsSectionHeight === "number" &&
          next.tagsSectionHeight < DEFAULT_TAGS_SECTION_HEIGHT
        ) {
          next.tagsSectionHeight = DEFAULT_TAGS_SECTION_HEIGHT;
        }
        if (
          !next.customSkillPlatformPaths ||
          typeof next.customSkillPlatformPaths !== "object" ||
          Array.isArray(next.customSkillPlatformPaths)
        ) {
          next.customSkillPlatformPaths = {};
        }
        return next;
      },
    },
  ),
);
