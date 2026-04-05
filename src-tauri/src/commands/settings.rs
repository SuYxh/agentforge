use crate::state::AppState;
use agentforge_core::database::settings::SettingsDB;
use tauri::State;

#[tauri::command]
pub async fn settings_get(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SettingsDB::get(&db, &key).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn settings_set(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SettingsDB::set(&db, &key, &value).map_err(|e| e.to_string())
}
