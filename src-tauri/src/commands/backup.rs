use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseBackup {
    pub version: i32,
    pub exported_at: String,
    pub prompts: Vec<serde_json::Value>,
    pub folders: Vec<serde_json::Value>,
    pub versions: Vec<serde_json::Value>,
    pub skills: Option<Vec<serde_json::Value>>,
    pub skill_versions: Option<Vec<serde_json::Value>>,
}

fn query_table_as_json(
    conn: &rusqlite::Connection,
    sql: &str,
) -> Result<Vec<serde_json::Value>, String> {
    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let col_count = stmt.column_count();
    let col_names: Vec<String> = (0..col_count)
        .map(|i| stmt.column_name(i).unwrap_or("").to_string())
        .collect();

    let rows = stmt
        .query_map([], |row| {
            let mut map = serde_json::Map::new();
            for (i, name) in col_names.iter().enumerate() {
                let val: rusqlite::types::Value = row.get(i)?;
                let json_val = match val {
                    rusqlite::types::Value::Null => serde_json::Value::Null,
                    rusqlite::types::Value::Integer(n) => serde_json::Value::Number(n.into()),
                    rusqlite::types::Value::Real(f) => serde_json::Value::Number(
                        serde_json::Number::from_f64(f).unwrap_or_else(|| 0i64.into()),
                    ),
                    rusqlite::types::Value::Text(ref s) => serde_json::Value::String(s.clone()),
                    rusqlite::types::Value::Blob(ref b) => serde_json::Value::String(
                        base64::engine::general_purpose::STANDARD.encode(b),
                    ),
                };
                map.insert(name.clone(), json_val);
            }
            Ok(serde_json::Value::Object(map))
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

#[tauri::command]
pub async fn backup_export_data(state: State<'_, AppState>) -> Result<DatabaseBackup, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let prompts = query_table_as_json(&db, "SELECT * FROM prompts")?;
    let folders = query_table_as_json(&db, "SELECT * FROM folders")?;
    let versions = query_table_as_json(&db, "SELECT * FROM prompt_versions")?;
    let skills = query_table_as_json(&db, "SELECT * FROM skills")?;
    let skill_versions = query_table_as_json(&db, "SELECT * FROM skill_versions")?;

    Ok(DatabaseBackup {
        version: 1,
        exported_at: chrono::Utc::now().to_rfc3339(),
        prompts,
        folders,
        versions,
        skills: if skills.is_empty() {
            None
        } else {
            Some(skills)
        },
        skill_versions: if skill_versions.is_empty() {
            None
        } else {
            Some(skill_versions)
        },
    })
}

#[tauri::command]
pub async fn backup_import_data(
    state: State<'_, AppState>,
    backup: DatabaseBackup,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    db.execute_batch(
        "DELETE FROM prompt_versions;
         DELETE FROM prompts;
         DELETE FROM folders;
         DELETE FROM skill_versions;
         DELETE FROM skills;",
    )
    .map_err(|e| e.to_string())?;

    for row in &backup.prompts {
        insert_json_row(&db, "prompts", row)?;
    }
    for row in &backup.folders {
        insert_json_row(&db, "folders", row)?;
    }
    for row in &backup.versions {
        insert_json_row(&db, "prompt_versions", row)?;
    }
    if let Some(ref skills) = backup.skills {
        for row in skills {
            insert_json_row(&db, "skills", row)?;
        }
    }
    if let Some(ref skill_versions) = backup.skill_versions {
        for row in skill_versions {
            insert_json_row(&db, "skill_versions", row)?;
        }
    }

    Ok(())
}

fn insert_json_row(
    conn: &rusqlite::Connection,
    table: &str,
    row: &serde_json::Value,
) -> Result<(), String> {
    let obj = row.as_object().ok_or("Row is not a JSON object")?;
    if obj.is_empty() {
        return Ok(());
    }

    let columns: Vec<&String> = obj.keys().collect();
    let placeholders: Vec<String> = (1..=columns.len()).map(|i| format!("?{}", i)).collect();

    let sql = format!(
        "INSERT OR IGNORE INTO {} ({}) VALUES ({})",
        table,
        columns
            .iter()
            .map(|c| c.as_str())
            .collect::<Vec<_>>()
            .join(", "),
        placeholders.join(", ")
    );

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let params: Vec<Box<dyn rusqlite::types::ToSql>> = columns
        .iter()
        .map(|col| -> Box<dyn rusqlite::types::ToSql> {
            match &obj[col.as_str()] {
                serde_json::Value::Null => Box::new(rusqlite::types::Null),
                serde_json::Value::Bool(b) => Box::new(if *b { 1i64 } else { 0i64 }),
                serde_json::Value::Number(n) => {
                    if let Some(i) = n.as_i64() {
                        Box::new(i)
                    } else if let Some(f) = n.as_f64() {
                        Box::new(f)
                    } else {
                        Box::new(rusqlite::types::Null)
                    }
                }
                serde_json::Value::String(s) => Box::new(s.clone()),
                other => Box::new(other.to_string()),
            }
        })
        .collect();

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    stmt.execute(param_refs.as_slice())
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn backup_clear_database(state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute_batch(
        "DELETE FROM prompt_versions;
         DELETE FROM prompts;
         DELETE FROM folders;
         DELETE FROM skill_versions;
         DELETE FROM skills;
         DELETE FROM settings;",
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
