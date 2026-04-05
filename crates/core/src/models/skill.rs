use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SkillCategory {
    General,
    Office,
    Dev,
    Ai,
    Data,
    Management,
    Deploy,
    Design,
    Security,
    Meta,
}

impl std::fmt::Display for SkillCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::General => write!(f, "general"),
            Self::Office => write!(f, "office"),
            Self::Dev => write!(f, "dev"),
            Self::Ai => write!(f, "ai"),
            Self::Data => write!(f, "data"),
            Self::Management => write!(f, "management"),
            Self::Deploy => write!(f, "deploy"),
            Self::Design => write!(f, "design"),
            Self::Security => write!(f, "security"),
            Self::Meta => write!(f, "meta"),
        }
    }
}

impl SkillCategory {
    pub fn from_str_opt(s: &str) -> Option<Self> {
        match s {
            "general" => Some(Self::General),
            "office" => Some(Self::Office),
            "dev" => Some(Self::Dev),
            "ai" => Some(Self::Ai),
            "data" => Some(Self::Data),
            "management" => Some(Self::Management),
            "deploy" => Some(Self::Deploy),
            "design" => Some(Self::Design),
            "security" => Some(Self::Security),
            "meta" => Some(Self::Meta),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub instructions: Option<String>,
    pub content: Option<String>,
    pub mcp_config: Option<String>,
    pub protocol_type: String,
    pub version: Option<String>,
    pub author: Option<String>,
    pub source_url: Option<String>,
    pub local_repo_path: Option<String>,
    pub tags: Option<Vec<String>>,
    pub original_tags: Option<Vec<String>>,
    pub is_favorite: bool,
    #[serde(rename = "currentVersion")]
    pub current_version: Option<i64>,
    #[serde(rename = "versionTrackingEnabled")]
    pub version_tracking_enabled: Option<bool>,
    pub created_at: i64,
    pub updated_at: i64,
    pub icon_url: Option<String>,
    pub icon_emoji: Option<String>,
    pub icon_background: Option<String>,
    pub category: Option<String>,
    pub is_builtin: Option<bool>,
    pub registry_slug: Option<String>,
    pub content_url: Option<String>,
    pub prerequisites: Option<Vec<String>>,
    pub compatibility: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSkillDTO {
    pub name: String,
    pub description: Option<String>,
    pub instructions: Option<String>,
    pub content: Option<String>,
    pub mcp_config: Option<String>,
    pub protocol_type: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,
    pub source_url: Option<String>,
    pub local_repo_path: Option<String>,
    pub tags: Option<Vec<String>>,
    pub original_tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub icon_url: Option<String>,
    pub icon_emoji: Option<String>,
    pub icon_background: Option<String>,
    pub category: Option<String>,
    pub is_builtin: Option<bool>,
    pub registry_slug: Option<String>,
    pub content_url: Option<String>,
    pub prerequisites: Option<Vec<String>>,
    pub compatibility: Option<Vec<String>>,
    #[serde(rename = "currentVersion")]
    pub current_version: Option<i64>,
    #[serde(rename = "versionTrackingEnabled")]
    pub version_tracking_enabled: Option<bool>,
    #[serde(rename = "skipInitialVersion")]
    pub skip_initial_version: Option<bool>,
    #[serde(rename = "overwriteExisting")]
    pub overwrite_existing: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSkillDTO {
    pub name: Option<String>,
    pub description: Option<String>,
    pub instructions: Option<String>,
    pub content: Option<String>,
    pub mcp_config: Option<String>,
    pub protocol_type: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,
    pub source_url: Option<String>,
    pub local_repo_path: Option<String>,
    pub tags: Option<Vec<String>>,
    pub original_tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub icon_url: Option<String>,
    pub icon_emoji: Option<String>,
    pub icon_background: Option<String>,
    pub category: Option<String>,
    pub is_builtin: Option<bool>,
    pub registry_slug: Option<String>,
    pub content_url: Option<String>,
    pub prerequisites: Option<Vec<String>>,
    pub compatibility: Option<Vec<String>>,
    #[serde(rename = "currentVersion")]
    pub current_version: Option<i64>,
    #[serde(rename = "versionTrackingEnabled")]
    pub version_tracking_enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillManifest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub version: Option<String>,
    pub author: Option<String>,
    pub tags: Option<Vec<String>>,
    pub instructions: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillVersion {
    pub id: String,
    #[serde(rename = "skillId")]
    pub skill_id: String,
    pub version: i64,
    pub content: Option<String>,
    #[serde(rename = "filesSnapshot")]
    pub files_snapshot: Option<Vec<SkillFileSnapshot>>,
    pub note: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillFileSnapshot {
    #[serde(rename = "relativePath")]
    pub relative_path: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillLocalFileEntry {
    pub path: String,
    pub content: String,
    #[serde(rename = "isDirectory")]
    pub is_directory: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillLocalFileTreeEntry {
    pub path: String,
    #[serde(rename = "isDirectory")]
    pub is_directory: bool,
    pub size: Option<u64>,
}
