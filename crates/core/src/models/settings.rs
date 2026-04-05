use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    En,
    Zh,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub theme: Theme,
    pub language: Language,
    #[serde(rename = "autoSave")]
    pub auto_save: bool,
    #[serde(rename = "defaultFolderId")]
    pub default_folder_id: Option<String>,
    #[serde(rename = "customSkillPlatformPaths")]
    pub custom_skill_platform_paths: Option<HashMap<String, String>>,
    pub security: Option<SecuritySettings>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecuritySettings {
    #[serde(rename = "masterPasswordConfigured")]
    pub master_password_configured: bool,
    pub unlocked: bool,
}

pub fn default_settings() -> Settings {
    Settings {
        theme: Theme::System,
        language: Language::Zh,
        auto_save: true,
        default_folder_id: None,
        custom_skill_platform_paths: None,
        security: None,
    }
}
