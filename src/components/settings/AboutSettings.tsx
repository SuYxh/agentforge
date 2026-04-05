import { useState, useEffect } from "react";
import {
  GithubIcon,
  ExternalLinkIcon,
  MessageSquareIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/stores/settings.store";
import { SettingSection, SettingItem, ToggleSwitch } from "./shared";

export function AboutSettings() {
  const { t } = useTranslation();
  const settings = useSettingsStore();

  const [appVersion, setAppVersion] = useState<string>("");
  useEffect(() => {
    import("@tauri-apps/api/app").then(({ getVersion }) => {
      getVersion().then((v) => setAppVersion(v || ""));
    });
  }, []);

  const handleOpenExternal = async (url: string) => {
    try {
      const { open } = await import("@tauri-apps/plugin-opener");
      await open(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <svg viewBox="0 0 512 512" className="w-16 h-16 mx-auto mb-3 rounded-2xl" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ab-bg" x1="0" y1="0" x2="0.8" y2="1"><stop offset="0%" stopColor="#0c0a1d"/><stop offset="100%" stopColor="#1a1530"/></linearGradient>
            <linearGradient id="ab-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient>
            <linearGradient id="ab-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fde68a"/><stop offset="50%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#f59e0b"/></linearGradient>
            <filter id="ab-glow"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <rect width="512" height="512" rx="112" fill="url(#ab-bg)"/>
          <path d="M256 96 L148 404 L192 404 L220 320 L292 320 L320 404 L364 404 Z" fill="none" stroke="url(#ab-blue)" strokeWidth="7" strokeLinejoin="round" opacity="0.85"/>
          <line x1="210" y1="284" x2="302" y2="284" stroke="url(#ab-blue)" strokeWidth="6" strokeLinecap="round" opacity="0.6"/>
          <path d="M280 128 L248 238 L280 238 L244 368" fill="none" stroke="url(#ab-gold)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" filter="url(#ab-glow)" opacity="0.9"/>
        </svg>
        <h2 className="text-lg font-semibold">AgentForge</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("settings.version")} {appVersion || "..."}
        </p>
      </div>

      <SettingSection title={t("settings.projectInfo")}>
        <div className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">
          <p>{t("settings.projectInfoDesc")}</p>
        </div>
      </SettingSection>

      <SettingSection title={t("settings.checkUpdate")}>
        <SettingItem
          label={t("settings.autoCheckUpdate")}
          description={t("settings.autoCheckUpdateDesc")}
        >
          <ToggleSwitch
            checked={settings.autoCheckUpdate}
            onChange={settings.setAutoCheckUpdate}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tryMirrorSource")}
          description={t("settings.mirrorSourceRisk")}
        >
          <ToggleSwitch
            checked={settings.useUpdateMirror}
            onChange={settings.setUseUpdateMirror}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.checkUpdate")}
          description={`${t("settings.version")}: ${appVersion || "..."}`}
        >
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-update-dialog"))
            }
            className="h-8 px-4 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
          >
            {t("settings.checkUpdate")}
          </button>
        </SettingItem>
      </SettingSection>

      <SettingSection title={t("settings.openSource")}>
        <SettingItem label="GitHub" description={t("settings.viewOnGithub")}>
          <button
            onClick={() =>
              handleOpenExternal("https://github.com/SuYxh/agentforge")
            }
            className="text-primary text-sm hover:underline"
          >
            GitHub
          </button>
        </SettingItem>
        <SettingItem
          label={t("settings.reportIssue")}
          description={t("settings.reportIssueDesc")}
        >
          <button
            onClick={() =>
              handleOpenExternal(
                "https://github.com/SuYxh/agentforge/issues/new",
              )
            }
            className="h-8 px-4 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600 transition-colors inline-flex items-center gap-1.5"
          >
            <MessageSquareIcon className="w-4 h-4" />
            Issue
          </button>
        </SettingItem>
      </SettingSection>

      <SettingSection title={t("settings.author")}>
        <div className="px-4 py-3 space-y-3">
          <button
            onClick={() =>
              handleOpenExternal("https://github.com/SuYxh")
            }
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
              <GithubIcon className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">@SuYxh</div>
              <div className="text-xs text-muted-foreground">GitHub</div>
            </div>
            <ExternalLinkIcon className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </SettingSection>

      <SettingSection title={t("settings.developer", "开发者选项")}>
        <SettingItem
          label={t("settings.debugMode", "调试模式")}
          description={t(
            "settings.debugModeDesc",
            "启用控制台调试 (支持 Ctrl+Shift+I / Cmd+Option+I 唤起)",
          )}
        >
          <ToggleSwitch
            checked={settings.debugMode}
            onChange={settings.setDebugMode}
          />
        </SettingItem>
      </SettingSection>

      <div className="px-4 py-4 text-sm text-muted-foreground text-center">
        <div>AGPL-3.0 License &copy; 2025 AgentForge</div>
      </div>
    </div>
  );
}
