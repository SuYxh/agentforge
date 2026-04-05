use std::sync::Mutex;
use tauri::Manager;
use agentforge_core::database::connection::open_database;
use agentforge_core::services::security::SecurityService;
use crate::state::AppState;

pub fn initialize(app: &tauri::App) -> Result<AppState, Box<dyn std::error::Error>> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    std::fs::create_dir_all(&app_data_dir)?;

    let db_path = app_data_dir.join("agentforge.db");
    let conn = open_database(db_path.to_str().unwrap())?;

    let skills_dir = app_data_dir.join("skills");
    std::fs::create_dir_all(&skills_dir)?;

    Ok(AppState {
        db: Mutex::new(conn),
        data_dir: app_data_dir.to_string_lossy().to_string(),
        skills_dir: skills_dir.to_string_lossy().to_string(),
        security: Mutex::new(SecurityService::new()),
    })
}
