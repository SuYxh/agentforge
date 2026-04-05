import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/stores/settings.store";
import { SettingSection, SettingItem } from "./shared";
import { Select, SelectOption } from "@/components/ui/Select";

const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: "zh", label: "简体中文" },
  { value: "en", label: "English" },
];

export function LanguageSettings() {
  const { t } = useTranslation();
  const settings = useSettingsStore();

  return (
    <div className="space-y-6">
      <SettingSection title={t("settings.language")}>
        <SettingItem
          label={t("settings.language")}
          description={t("settings.selectLanguage")}
        >
          <Select
            value={settings.language}
            onChange={(value) => settings.setLanguage(value)}
            options={LANGUAGE_OPTIONS}
            className="w-40"
          />
        </SettingItem>
      </SettingSection>
    </div>
  );
}
