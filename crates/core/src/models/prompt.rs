use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PromptType {
    Text,
    Image,
    Video,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum VariableType {
    Text,
    Textarea,
    Number,
    Select,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variable {
    pub name: String,
    #[serde(rename = "type")]
    pub var_type: VariableType,
    pub label: Option<String>,
    #[serde(rename = "defaultValue")]
    pub default_value: Option<String>,
    pub options: Option<Vec<String>>,
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "promptType")]
    pub prompt_type: Option<PromptType>,
    #[serde(rename = "systemPrompt")]
    pub system_prompt: Option<String>,
    #[serde(rename = "systemPromptEn")]
    pub system_prompt_en: Option<String>,
    #[serde(rename = "userPrompt")]
    pub user_prompt: String,
    #[serde(rename = "userPromptEn")]
    pub user_prompt_en: Option<String>,
    pub variables: Vec<Variable>,
    pub tags: Vec<String>,
    #[serde(rename = "folderId")]
    pub folder_id: Option<String>,
    pub images: Option<Vec<String>>,
    pub videos: Option<Vec<String>>,
    #[serde(rename = "isFavorite")]
    pub is_favorite: bool,
    #[serde(rename = "isPinned")]
    pub is_pinned: bool,
    pub version: i64,
    #[serde(rename = "currentVersion")]
    pub current_version: i64,
    #[serde(rename = "usageCount")]
    pub usage_count: i64,
    pub source: Option<String>,
    pub notes: Option<String>,
    #[serde(rename = "lastAiResponse")]
    pub last_ai_response: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePromptDTO {
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "promptType")]
    pub prompt_type: Option<PromptType>,
    #[serde(rename = "systemPrompt")]
    pub system_prompt: Option<String>,
    #[serde(rename = "systemPromptEn")]
    pub system_prompt_en: Option<String>,
    #[serde(rename = "userPrompt")]
    pub user_prompt: String,
    #[serde(rename = "userPromptEn")]
    pub user_prompt_en: Option<String>,
    pub variables: Option<Vec<Variable>>,
    pub tags: Option<Vec<String>>,
    #[serde(rename = "folderId")]
    pub folder_id: Option<String>,
    pub images: Option<Vec<String>>,
    pub videos: Option<Vec<String>>,
    pub source: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePromptDTO {
    pub title: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "promptType")]
    pub prompt_type: Option<PromptType>,
    #[serde(rename = "systemPrompt")]
    pub system_prompt: Option<String>,
    #[serde(rename = "systemPromptEn")]
    pub system_prompt_en: Option<String>,
    #[serde(rename = "userPrompt")]
    pub user_prompt: Option<String>,
    #[serde(rename = "userPromptEn")]
    pub user_prompt_en: Option<String>,
    pub variables: Option<Vec<Variable>>,
    pub tags: Option<Vec<String>>,
    #[serde(rename = "folderId")]
    pub folder_id: Option<String>,
    pub images: Option<Vec<String>>,
    pub videos: Option<Vec<String>>,
    #[serde(rename = "isFavorite")]
    pub is_favorite: Option<bool>,
    #[serde(rename = "isPinned")]
    pub is_pinned: Option<bool>,
    #[serde(rename = "usageCount")]
    pub usage_count: Option<i64>,
    pub source: Option<String>,
    pub notes: Option<String>,
    #[serde(rename = "lastAiResponse")]
    pub last_ai_response: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    pub keyword: Option<String>,
    pub tags: Option<Vec<String>>,
    #[serde(rename = "folderId")]
    pub folder_id: Option<String>,
    #[serde(rename = "isFavorite")]
    pub is_favorite: Option<bool>,
    #[serde(rename = "sortBy")]
    pub sort_by: Option<String>,
    #[serde(rename = "sortOrder")]
    pub sort_order: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptVersion {
    pub id: String,
    #[serde(rename = "promptId")]
    pub prompt_id: String,
    pub version: i64,
    #[serde(rename = "systemPrompt")]
    pub system_prompt: Option<String>,
    #[serde(rename = "userPrompt")]
    pub user_prompt: String,
    pub variables: Vec<Variable>,
    pub note: Option<String>,
    #[serde(rename = "aiResponse")]
    pub ai_response: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}
