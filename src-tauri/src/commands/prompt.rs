use tauri::State;
use crate::state::AppState;
use agentforge_core::models::prompt::{CreatePromptDTO, UpdatePromptDTO, Prompt, PromptVersion, SearchQuery};
use agentforge_core::database::prompt::PromptDB;

#[tauri::command]
pub async fn prompt_create(state: State<'_, AppState>, dto: CreatePromptDTO) -> Result<Prompt, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    PromptDB::create(&db, dto).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn prompt_get(state: State<'_, AppState>, id: String) -> Result<Option<Prompt>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    PromptDB::get_by_id(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn prompt_get_all(state: State<'_, AppState>) -> Result<Vec<Prompt>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    PromptDB::get_all(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn prompt_update(state: State<'_, AppState>, id: String, dto: UpdatePromptDTO) -> Result<Prompt, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    PromptDB::update(&db, &id, dto).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn prompt_delete(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    PromptDB::delete(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn prompt_search(state: State<'_, AppState>, query: SearchQuery) -> Result<Vec<Prompt>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    PromptDB::search(&db, query).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn prompt_copy(state: State<'_, AppState>, id: String) -> Result<Prompt, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    PromptDB::copy(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn version_get_all(state: State<'_, AppState>, prompt_id: String) -> Result<Vec<PromptVersion>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    PromptDB::version_get_all(&db, &prompt_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn version_create(state: State<'_, AppState>, prompt_id: String, system_prompt: Option<String>, user_prompt: String, note: Option<String>) -> Result<PromptVersion, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    PromptDB::version_create(&db, &prompt_id, system_prompt, user_prompt, note).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn version_rollback(state: State<'_, AppState>, prompt_id: String, version: i64) -> Result<Prompt, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    PromptDB::version_rollback(&db, &prompt_id, version).map_err(|e| e.to_string())
}
