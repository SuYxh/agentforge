use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    #[serde(rename = "parentId")]
    pub parent_id: Option<String>,
    pub order: i64,
    #[serde(rename = "isPrivate")]
    pub is_private: Option<bool>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFolderDTO {
    pub name: String,
    pub icon: Option<String>,
    #[serde(rename = "parentId")]
    pub parent_id: Option<String>,
    #[serde(rename = "isPrivate")]
    pub is_private: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFolderDTO {
    pub name: Option<String>,
    pub icon: Option<String>,
    #[serde(rename = "parentId")]
    pub parent_id: Option<Option<String>>,
    pub order: Option<i64>,
    #[serde(rename = "isPrivate")]
    pub is_private: Option<bool>,
}
