use tauri::State;
use crate::state::AppState;
use agentforge_core::services::security::SecurityStatus;

#[tauri::command]
pub async fn security_status(state: State<'_, AppState>) -> Result<SecurityStatus, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let security = state.security.lock().map_err(|e| e.to_string())?;
    Ok(security.status(&db))
}

#[tauri::command]
pub async fn security_set_master_password(
    state: State<'_, AppState>,
    password: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut security = state.security.lock().map_err(|e| e.to_string())?;
    security.set_master_password(&db, &password).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_unlock(
    state: State<'_, AppState>,
    password: String,
) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut security = state.security.lock().map_err(|e| e.to_string())?;
    security.unlock(&db, &password).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_lock(state: State<'_, AppState>) -> Result<(), String> {
    let mut security = state.security.lock().map_err(|e| e.to_string())?;
    security.lock();
    Ok(())
}

#[tauri::command]
pub async fn security_encrypt(
    state: State<'_, AppState>,
    text: String,
) -> Result<String, String> {
    let security = state.security.lock().map_err(|e| e.to_string())?;
    security.encrypt_text(&text).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn security_decrypt(
    state: State<'_, AppState>,
    data: String,
) -> Result<String, String> {
    let security = state.security.lock().map_err(|e| e.to_string())?;
    security.decrypt_text(&data).map_err(|e| e.to_string())
}
