import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/stores/settings.store";
import { SettingSection, SettingItem, ToggleSwitch } from "./shared";
import { Select } from "@/components/ui/Select";

export function GeneralSettings() {
  const { t } = useTranslation();
  const settings = useSettingsStore();

  return (
    <div className="space-y-6">
      <SettingSection title={t("settings.startup")}>
        <SettingItem
          label={t("settings.minimizeOnLaunch")}
          description={t("settings.minimizeOnLaunchDesc")}
        >
          <ToggleSwitch
            checked={settings.minimizeOnLaunch}
            onChange={settings.setMinimizeOnLaunch}
          />
        </SettingItem>
        {navigator.platform.toLowerCase().includes("win") && (
          <SettingItem
            label={t("settings.closeAction")}
            description={t("settings.closeActionDesc")}
          >
            <Select
              value={settings.closeAction}
              onChange={(value) =>
                settings.setCloseAction(value as "ask" | "minimize" | "exit")
              }
              options={[
                { value: "ask", label: t("settings.askEveryTime") },
                { value: "minimize", label: t("settings.closeToTray") },
                { value: "exit", label: t("settings.closeApp") },
              ]}
              className="w-40"
            />
          </SettingItem>
        )}
      </SettingSection>

      <SettingSection title={t("settings.editor")}>
        <SettingItem
          label={t("settings.autoSave")}
          description={t("settings.autoSaveDesc")}
        >
          <ToggleSwitch
            checked={settings.autoSave}
            onChange={settings.setAutoSave}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.showLineNumbers")}
          description={t("settings.showLineNumbersDesc")}
        >
          <ToggleSwitch
            checked={settings.showLineNumbers}
            onChange={settings.setShowLineNumbers}
          />
        </SettingItem>
      </SettingSection>
    </div>
  );
}
