use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, Row};
use uuid::Uuid;

use crate::error::AppError;
use crate::models::folder::*;

#[derive(Debug, Clone, serde::Deserialize)]
pub struct FolderOrderUpdate {
    pub id: String,
    pub order: i64,
}

pub struct FolderDB;

fn millis_to_iso(millis: i64) -> String {
    DateTime::from_timestamp_millis(millis)
        .unwrap_or_default()
        .to_rfc3339()
}

fn row_to_folder(row: &Row) -> Result<Folder, rusqlite::Error> {
    let created_at_millis: i64 = row.get("created_at")?;
    let updated_at_millis: Option<i64> = row.get("updated_at")?;
    let is_private_int: i64 = row.get("is_private")?;

    Ok(Folder {
        id: row.get("id")?,
        name: row.get("name")?,
        icon: row.get("icon")?,
        parent_id: row.get("parent_id")?,
        order: row.get("sort_order")?,
        is_private: Some(is_private_int != 0),
        created_at: millis_to_iso(created_at_millis),
        updated_at: millis_to_iso(updated_at_millis.unwrap_or(created_at_millis)),
    })
}

impl FolderDB {
    pub fn create(conn: &Connection, dto: CreateFolderDTO) -> Result<Folder, AppError> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        let max_order: Option<i64> = conn.query_row(
            "SELECT MAX(sort_order) FROM folders WHERE parent_id IS ?1",
            params![dto.parent_id],
            |row| row.get(0),
        )?;
        let order = max_order.unwrap_or(-1) + 1;

        conn.execute(
            "INSERT INTO folders (id, name, icon, parent_id, sort_order, is_private, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                id,
                dto.name,
                dto.icon,
                dto.parent_id,
                order,
                if dto.is_private.unwrap_or(false) { 1 } else { 0 },
                now,
                now,
            ],
        )?;

        Self::get_by_id(conn, &id)?
            .ok_or_else(|| AppError::NotFound("Folder not found after creation".to_string()))
    }

    fn get_by_id(conn: &Connection, id: &str) -> Result<Option<Folder>, AppError> {
        let mut stmt = conn.prepare("SELECT * FROM folders WHERE id = ?1")?;
        let mut rows = stmt.query_map(params![id], row_to_folder)?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn get_all(conn: &Connection) -> Result<Vec<Folder>, AppError> {
        let mut stmt = conn.prepare("SELECT * FROM folders ORDER BY sort_order ASC")?;
        let rows = stmt.query_map([], row_to_folder)?;
        let mut folders = Vec::new();
        for row in rows {
            folders.push(row?);
        }
        Ok(folders)
    }

    pub fn update(
        conn: &Connection,
        id: &str,
        dto: UpdateFolderDTO,
    ) -> Result<Folder, AppError> {
        let now = Utc::now().timestamp_millis();
        let mut set_clauses = vec!["updated_at = ?1".to_string()];
        let mut param_index: usize = 2;

        enum ParamValue {
            Text(String),
            OptText(Option<String>),
            Int(i64),
        }

        let mut param_values: Vec<ParamValue> = vec![];

        if let Some(ref name) = dto.name {
            set_clauses.push(format!("name = ?{}", param_index));
            param_values.push(ParamValue::Text(name.clone()));
            param_index += 1;
        }

        if let Some(ref icon) = dto.icon {
            set_clauses.push(format!("icon = ?{}", param_index));
            param_values.push(ParamValue::Text(icon.clone()));
            param_index += 1;
        }

        if let Some(ref parent_id) = dto.parent_id {
            set_clauses.push(format!("parent_id = ?{}", param_index));
            param_values.push(ParamValue::OptText(parent_id.clone()));
            param_index += 1;
        }

        if let Some(order) = dto.order {
            set_clauses.push(format!("sort_order = ?{}", param_index));
            param_values.push(ParamValue::Int(order));
            param_index += 1;
        }

        if let Some(is_private) = dto.is_private {
            set_clauses.push(format!("is_private = ?{}", param_index));
            param_values.push(ParamValue::Int(if is_private { 1 } else { 0 }));
            param_index += 1;
        }

        let sql = format!(
            "UPDATE folders SET {} WHERE id = ?{}",
            set_clauses.join(", "),
            param_index
        );

        let mut stmt = conn.prepare(&sql)?;

        let mut dynamic_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
        dynamic_params.push(Box::new(now));

        for val in param_values {
            match val {
                ParamValue::Text(s) => dynamic_params.push(Box::new(s)),
                ParamValue::OptText(s) => dynamic_params.push(Box::new(s)),
                ParamValue::Int(i) => dynamic_params.push(Box::new(i)),
            }
        }

        dynamic_params.push(Box::new(id.to_string()));

        let param_refs: Vec<&dyn rusqlite::types::ToSql> =
            dynamic_params.iter().map(|p| p.as_ref()).collect();
        stmt.execute(param_refs.as_slice())?;

        Self::get_by_id(conn, id)?
            .ok_or_else(|| AppError::NotFound(format!("Folder not found: {}", id)))
    }

    pub fn delete(conn: &Connection, id: &str) -> Result<bool, AppError> {
        let affected = conn.execute("DELETE FROM folders WHERE id = ?1", params![id])?;
        Ok(affected > 0)
    }

    pub fn reorder(conn: &Connection, updates: Vec<FolderOrderUpdate>) -> Result<(), AppError> {
        let tx = conn.unchecked_transaction()?;
        {
            let mut stmt =
                tx.prepare("UPDATE folders SET sort_order = ?1 WHERE id = ?2")?;
            for update in &updates {
                stmt.execute(params![update.order, update.id])?;
            }
        }
        tx.commit()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::folder::{CreateFolderDTO, UpdateFolderDTO};

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA journal_mode=WAL;").unwrap();
        conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        crate::database::schema::migrate(&conn).unwrap();
        conn
    }

    #[test]
    fn test_create_folder() {
        let conn = setup_test_db();
        let folder = FolderDB::create(
            &conn,
            CreateFolderDTO {
                name: "Work".to_string(),
                icon: Some("📁".to_string()),
                parent_id: None,
                is_private: None,
            },
        )
        .unwrap();
        assert_eq!(folder.name, "Work");
        assert_eq!(folder.icon.as_deref(), Some("📁"));
        assert!(!folder.id.is_empty());
    }

    #[test]
    fn test_get_all_folders() {
        let conn = setup_test_db();
        FolderDB::create(
            &conn,
            CreateFolderDTO {
                name: "A".to_string(),
                icon: None,
                parent_id: None,
                is_private: None,
            },
        )
        .unwrap();
        FolderDB::create(
            &conn,
            CreateFolderDTO {
                name: "B".to_string(),
                icon: None,
                parent_id: None,
                is_private: None,
            },
        )
        .unwrap();
        let all = FolderDB::get_all(&conn).unwrap();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_update_folder() {
        let conn = setup_test_db();
        let folder = FolderDB::create(
            &conn,
            CreateFolderDTO {
                name: "Old".to_string(),
                icon: None,
                parent_id: None,
                is_private: None,
            },
        )
        .unwrap();
        let updated = FolderDB::update(
            &conn,
            &folder.id,
            UpdateFolderDTO {
                name: Some("New".to_string()),
                icon: None,
                parent_id: None,
                order: None,
                is_private: Some(true),
            },
        )
        .unwrap();
        assert_eq!(updated.name, "New");
        assert_eq!(updated.is_private, Some(true));
    }

    #[test]
    fn test_delete_folder() {
        let conn = setup_test_db();
        let folder = FolderDB::create(
            &conn,
            CreateFolderDTO {
                name: "Temp".to_string(),
                icon: None,
                parent_id: None,
                is_private: None,
            },
        )
        .unwrap();
        let deleted = FolderDB::delete(&conn, &folder.id).unwrap();
        assert!(deleted);
        let all = FolderDB::get_all(&conn).unwrap();
        assert!(all.is_empty());
    }
}
