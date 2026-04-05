use std::sync::Mutex;
use rusqlite::Connection;
use agentforge_core::services::security::SecurityService;

pub struct AppState {
    pub db: Mutex<Connection>,
    pub data_dir: String,
    pub skills_dir: String,
    pub security: Mutex<SecurityService>,
}
