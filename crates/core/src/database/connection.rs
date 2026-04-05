use crate::error::AppError;
use rusqlite::Connection;

use super::schema;

pub fn open_database(path: &str) -> Result<Connection, AppError> {
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;
    schema::migrate(&conn)?;
    Ok(conn)
}
