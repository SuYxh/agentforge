use agentforge_core::services::security::SecurityService;
use rusqlite::Connection;
use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<Connection>,
    pub data_dir: String,
    pub skills_dir: String,
    pub security: Mutex<SecurityService>,
}
