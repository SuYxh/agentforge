use tauri::State;
use crate::state::AppState;
use agentforge_core::models::folder::{CreateFolderDTO, UpdateFolderDTO, Folder};
use agentforge_core::database::folder::{FolderDB, FolderOrderUpdate};

#[tauri::command]
pub async fn folder_create(state: State<'_, AppState>, dto: CreateFolderDTO) -> Result<Folder, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    FolderDB::create(&db, dto).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn folder_get_all(state: State<'_, AppState>) -> Result<Vec<Folder>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    FolderDB::get_all(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn folder_update(state: State<'_, AppState>, id: String, dto: UpdateFolderDTO) -> Result<Folder, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    FolderDB::update(&db, &id, dto).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn folder_delete(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    FolderDB::delete(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn folder_reorder(state: State<'_, AppState>, updates: Vec<FolderOrderUpdate>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    FolderDB::reorder(&db, updates).map_err(|e| e.to_string())
}
