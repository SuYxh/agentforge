use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, Row};
use uuid::Uuid;

use crate::error::AppError;
use crate::models::prompt::*;

pub struct PromptDB;

fn millis_to_iso(millis: i64) -> String {
    DateTime::from_timestamp_millis(millis)
        .unwrap_or_default()
        .to_rfc3339()
}

fn row_to_prompt_version(row: &Row) -> Result<PromptVersion, rusqlite::Error> {
    let variables_json: Option<String> = row.get("variables")?;
    let variables: Vec<Variable> = variables_json
        .as_deref()
        .filter(|s| !s.is_empty())
        .and_then(|s| serde_json::from_str(s).ok())
        .unwrap_or_default();
    let created_at_millis: i64 = row.get("created_at")?;

    Ok(PromptVersion {
        id: row.get("id")?,
        prompt_id: row.get("prompt_id")?,
        version: row.get("version")?,
        system_prompt: row.get("system_prompt")?,
        user_prompt: row.get("user_prompt")?,
        variables,
        note: row.get("note")?,
        ai_response: None,
        created_at: millis_to_iso(created_at_millis),
    })
}

fn row_to_prompt(row: &Row) -> Result<Prompt, rusqlite::Error> {
    let variables_json: Option<String> = row.get("variables")?;
    let tags_json: Option<String> = row.get("tags")?;
    let images_json: Option<String> = row.get("images")?;

    let variables: Vec<Variable> = variables_json
        .as_deref()
        .filter(|s| !s.is_empty())
        .and_then(|s| serde_json::from_str(s).ok())
        .unwrap_or_default();

    let tags: Vec<String> = tags_json
        .as_deref()
        .filter(|s| !s.is_empty())
        .and_then(|s| serde_json::from_str(s).ok())
        .unwrap_or_default();

    let images: Option<Vec<String>> = images_json
        .as_deref()
        .filter(|s| !s.is_empty())
        .and_then(|s| serde_json::from_str(s).ok());

    let created_at_millis: i64 = row.get("created_at")?;
    let updated_at_millis: i64 = row.get("updated_at")?;
    let is_favorite_int: i64 = row.get("is_favorite")?;
    let is_pinned_int: i64 = row.get("is_pinned")?;
    let current_version: i64 = row.get("current_version")?;

    Ok(Prompt {
        id: row.get("id")?,
        title: row.get("title")?,
        description: row.get("description")?,
        prompt_type: row
            .get::<_, Option<String>>("prompt_type")?
            .and_then(|s| serde_json::from_str(&format!("\"{}\"", s)).ok()),
        system_prompt: row.get("system_prompt")?,
        system_prompt_en: None,
        user_prompt: row.get("user_prompt")?,
        user_prompt_en: None,
        variables,
        tags,
        folder_id: row.get("folder_id")?,
        images,
        videos: None,
        is_favorite: is_favorite_int != 0,
        is_pinned: is_pinned_int != 0,
        version: current_version,
        current_version,
        usage_count: row.get("usage_count")?,
        source: row.get("source")?,
        notes: row.get("notes")?,
        last_ai_response: None,
        created_at: millis_to_iso(created_at_millis),
        updated_at: millis_to_iso(updated_at_millis),
    })
}

impl PromptDB {
    pub fn create(conn: &Connection, dto: CreatePromptDTO) -> Result<Prompt, AppError> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        let variables_json = serde_json::to_string(&dto.variables.unwrap_or_default())?;
        let tags_json = serde_json::to_string(&dto.tags.unwrap_or_default())?;
        let images_json = serde_json::to_string(&dto.images.unwrap_or_default())?;
        let prompt_type = dto
            .prompt_type
            .map(|pt| {
                serde_json::to_string(&pt)
                    .unwrap_or_default()
                    .trim_matches('"')
                    .to_string()
            })
            .unwrap_or_else(|| "text".to_string());

        conn.execute(
            "INSERT INTO prompts (
                id, title, description, prompt_type, system_prompt, user_prompt,
                variables, tags, folder_id, images, source, notes,
                is_favorite, is_pinned, current_version, usage_count,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 0, 0, 1, 0, ?13, ?14)",
            params![
                id,
                dto.title,
                dto.description,
                prompt_type,
                dto.system_prompt,
                dto.user_prompt,
                variables_json,
                tags_json,
                dto.folder_id,
                images_json,
                dto.source,
                dto.notes,
                now,
                now,
            ],
        )?;

        Self::get_by_id(conn, &id)?
            .ok_or_else(|| AppError::NotFound("Prompt not found after creation".to_string()))
    }

    pub fn get_by_id(conn: &Connection, id: &str) -> Result<Option<Prompt>, AppError> {
        let mut stmt = conn.prepare("SELECT * FROM prompts WHERE id = ?1")?;
        let mut rows = stmt.query_map(params![id], row_to_prompt)?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn get_all(conn: &Connection) -> Result<Vec<Prompt>, AppError> {
        let mut stmt =
            conn.prepare("SELECT * FROM prompts ORDER BY is_pinned DESC, updated_at DESC")?;
        let rows = stmt.query_map([], row_to_prompt)?;
        let mut prompts = Vec::new();
        for row in rows {
            prompts.push(row?);
        }
        Ok(prompts)
    }

    pub fn update(
        conn: &Connection,
        id: &str,
        dto: UpdatePromptDTO,
    ) -> Result<Prompt, AppError> {
        let now = Utc::now().timestamp_millis();
        let mut set_clauses = vec!["updated_at = ?1".to_string()];
        let mut param_index: usize = 2;

        enum ParamValue {
            Text(String),
            OptText(Option<String>),
            Int(i64),
        }

        let mut param_values: Vec<ParamValue> = vec![];

        macro_rules! add_field {
            ($field:expr, $col:expr) => {
                if let Some(val) = $field {
                    set_clauses.push(format!("{} = ?{}", $col, param_index));
                    param_values.push(ParamValue::Text(val));
                    param_index += 1;
                }
            };
        }

        macro_rules! add_opt_field {
            ($field:expr, $col:expr) => {
                if let Some(val) = $field {
                    set_clauses.push(format!("{} = ?{}", $col, param_index));
                    param_values.push(ParamValue::OptText(val));
                    param_index += 1;
                }
            };
        }

        add_field!(dto.title, "title");
        add_field!(dto.description, "description");

        if let Some(ref pt) = dto.prompt_type {
            let pt_str = serde_json::to_string(pt)?
                .trim_matches('"')
                .to_string();
            set_clauses.push(format!("prompt_type = ?{}", param_index));
            param_values.push(ParamValue::Text(pt_str));
            param_index += 1;
        }

        add_field!(dto.system_prompt, "system_prompt");
        add_field!(dto.user_prompt, "user_prompt");

        if let Some(ref vars) = dto.variables {
            let json = serde_json::to_string(vars)?;
            set_clauses.push(format!("variables = ?{}", param_index));
            param_values.push(ParamValue::Text(json));
            param_index += 1;
        }

        if let Some(ref tags) = dto.tags {
            let json = serde_json::to_string(tags)?;
            set_clauses.push(format!("tags = ?{}", param_index));
            param_values.push(ParamValue::Text(json));
            param_index += 1;
        }

        add_opt_field!(dto.folder_id.map(Some), "folder_id");

        if let Some(ref images) = dto.images {
            let json = serde_json::to_string(images)?;
            set_clauses.push(format!("images = ?{}", param_index));
            param_values.push(ParamValue::Text(json));
            param_index += 1;
        }

        if let Some(fav) = dto.is_favorite {
            set_clauses.push(format!("is_favorite = ?{}", param_index));
            param_values.push(ParamValue::Int(if fav { 1 } else { 0 }));
            param_index += 1;
        }

        if let Some(pinned) = dto.is_pinned {
            set_clauses.push(format!("is_pinned = ?{}", param_index));
            param_values.push(ParamValue::Int(if pinned { 1 } else { 0 }));
            param_index += 1;
        }

        if let Some(count) = dto.usage_count {
            set_clauses.push(format!("usage_count = ?{}", param_index));
            param_values.push(ParamValue::Int(count));
            param_index += 1;
        }

        add_field!(dto.source, "source");
        add_field!(dto.notes, "notes");

        let sql = format!(
            "UPDATE prompts SET {} WHERE id = ?{}",
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
            .ok_or_else(|| AppError::NotFound(format!("Prompt not found: {}", id)))
    }

    pub fn delete(conn: &Connection, id: &str) -> Result<bool, AppError> {
        let affected = conn.execute("DELETE FROM prompts WHERE id = ?1", params![id])?;
        Ok(affected > 0)
    }

    pub fn search(conn: &Connection, query: SearchQuery) -> Result<Vec<Prompt>, AppError> {
        let mut conditions = Vec::new();
        let mut dynamic_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
        let mut param_idx: usize = 1;

        let use_fts = query.keyword.is_some();
        let base_select = if use_fts {
            "SELECT p.* FROM prompts p JOIN prompts_fts fts ON p.rowid = fts.rowid"
        } else {
            "SELECT * FROM prompts p"
        };

        if let Some(ref keyword) = query.keyword {
            let escaped = keyword.replace('"', "\"\"");
            conditions.push(format!("prompts_fts MATCH ?{}", param_idx));
            dynamic_params.push(Box::new(format!("\"{}\"", escaped)));
            param_idx += 1;
        }

        if let Some(ref folder_id) = query.folder_id {
            conditions.push(format!("p.folder_id = ?{}", param_idx));
            dynamic_params.push(Box::new(folder_id.clone()));
            param_idx += 1;
        }

        if let Some(fav) = query.is_favorite {
            conditions.push(format!("p.is_favorite = ?{}", param_idx));
            dynamic_params.push(Box::new(if fav { 1i64 } else { 0i64 }));
            param_idx += 1;
        }

        if let Some(ref tags) = query.tags {
            if !tags.is_empty() {
                let tag_conditions: Vec<String> = tags
                    .iter()
                    .map(|_| {
                        let cond = format!("p.tags LIKE ?{}", param_idx);
                        param_idx += 1;
                        cond
                    })
                    .collect();
                conditions.push(format!("({})", tag_conditions.join(" OR ")));
                for tag in tags {
                    dynamic_params.push(Box::new(format!("%\"{}\"%" , tag)));
                }
            }
        }

        let where_clause = if conditions.is_empty() {
            String::new()
        } else {
            format!(" WHERE {}", conditions.join(" AND "))
        };

        let sort_column = match query.sort_by.as_deref() {
            Some("title") => "p.title",
            Some("createdAt") => "p.created_at",
            Some("usageCount") => "p.usage_count",
            _ => "p.updated_at",
        };
        let sort_order = match query.sort_order.as_deref() {
            Some(o) if o.eq_ignore_ascii_case("asc") => "ASC",
            _ => "DESC",
        };
        let order_clause = format!(" ORDER BY {} {}", sort_column, sort_order);

        let mut limit_clause = String::new();
        if let Some(limit) = query.limit {
            limit_clause.push_str(&format!(" LIMIT ?{}", param_idx));
            dynamic_params.push(Box::new(limit));
            param_idx += 1;
            if let Some(offset) = query.offset {
                limit_clause.push_str(&format!(" OFFSET ?{}", param_idx));
                dynamic_params.push(Box::new(offset));
                #[allow(unused_assignments)]
                { param_idx += 1; }
            }
        }

        let sql = format!(
            "{}{}{}{}",
            base_select, where_clause, order_clause, limit_clause
        );

        let mut stmt = conn.prepare(&sql)?;
        let param_refs: Vec<&dyn rusqlite::types::ToSql> =
            dynamic_params.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(param_refs.as_slice(), row_to_prompt)?;

        let mut prompts = Vec::new();
        for row in rows {
            prompts.push(row?);
        }
        Ok(prompts)
    }

    pub fn copy(conn: &Connection, id: &str) -> Result<Prompt, AppError> {
        let original = Self::get_by_id(conn, id)?
            .ok_or_else(|| AppError::NotFound(format!("Prompt not found: {}", id)))?;

        let new_id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        let variables_json = serde_json::to_string(&original.variables)?;
        let tags_json = serde_json::to_string(&original.tags)?;
        let images_json = match &original.images {
            Some(imgs) => serde_json::to_string(imgs)?,
            None => "[]".to_string(),
        };
        let prompt_type = original
            .prompt_type
            .map(|pt| {
                serde_json::to_string(&pt)
                    .unwrap_or_default()
                    .trim_matches('"')
                    .to_string()
            })
            .unwrap_or_else(|| "text".to_string());

        let new_title = format!("{} (Copy)", original.title);

        conn.execute(
            "INSERT INTO prompts (
                id, title, description, prompt_type, system_prompt, user_prompt,
                variables, tags, folder_id, images, source, notes,
                is_favorite, is_pinned, current_version, usage_count,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 0, 0, 1, 0, ?13, ?14)",
            params![
                new_id,
                new_title,
                original.description,
                prompt_type,
                original.system_prompt,
                original.user_prompt,
                variables_json,
                tags_json,
                original.folder_id,
                images_json,
                original.source,
                original.notes,
                now,
                now,
            ],
        )?;

        Self::get_by_id(conn, &new_id)?
            .ok_or_else(|| AppError::NotFound("Prompt not found after copy".to_string()))
    }

    pub fn version_get_all(
        conn: &Connection,
        prompt_id: &str,
    ) -> Result<Vec<PromptVersion>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT * FROM prompt_versions WHERE prompt_id = ?1 ORDER BY version DESC",
        )?;
        let rows = stmt.query_map(params![prompt_id], row_to_prompt_version)?;
        let mut versions = Vec::new();
        for row in rows {
            versions.push(row?);
        }
        Ok(versions)
    }

    pub fn version_create(
        conn: &Connection,
        prompt_id: &str,
        system_prompt: Option<String>,
        user_prompt: String,
        note: Option<String>,
    ) -> Result<PromptVersion, AppError> {
        let max_version: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM prompt_versions WHERE prompt_id = ?1",
                params![prompt_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let new_version = max_version + 1;
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "INSERT INTO prompt_versions (id, prompt_id, version, system_prompt, user_prompt, variables, note, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![id, prompt_id, new_version, system_prompt, user_prompt, "[]", note, now],
        )?;

        conn.execute(
            "UPDATE prompts SET current_version = ?1, updated_at = ?2 WHERE id = ?3",
            params![new_version, now, prompt_id],
        )?;

        Ok(PromptVersion {
            id,
            prompt_id: prompt_id.to_string(),
            version: new_version,
            system_prompt,
            user_prompt,
            variables: vec![],
            note,
            ai_response: None,
            created_at: millis_to_iso(now),
        })
    }

    pub fn version_rollback(
        conn: &Connection,
        prompt_id: &str,
        version: i64,
    ) -> Result<Prompt, AppError> {
        let mut stmt = conn.prepare(
            "SELECT * FROM prompt_versions WHERE prompt_id = ?1 AND version = ?2",
        )?;
        let ver = stmt
            .query_row(params![prompt_id, version], row_to_prompt_version)
            .map_err(|_| {
                AppError::NotFound(format!(
                    "Version {} not found for prompt {}",
                    version, prompt_id
                ))
            })?;

        let now = Utc::now().timestamp_millis();
        conn.execute(
            "UPDATE prompts SET system_prompt = ?1, user_prompt = ?2, updated_at = ?3 WHERE id = ?4",
            params![ver.system_prompt, ver.user_prompt, now, prompt_id],
        )?;

        Self::get_by_id(conn, prompt_id)?
            .ok_or_else(|| AppError::NotFound(format!("Prompt not found: {}", prompt_id)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::prompt::{CreatePromptDTO, SearchQuery, UpdatePromptDTO};

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA journal_mode=WAL;").unwrap();
        conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        crate::database::schema::migrate(&conn).unwrap();
        conn
    }

    fn make_create_dto(title: &str) -> CreatePromptDTO {
        CreatePromptDTO {
            title: title.to_string(),
            description: Some("desc".to_string()),
            prompt_type: None,
            system_prompt: Some("system".to_string()),
            system_prompt_en: None,
            user_prompt: "user prompt".to_string(),
            user_prompt_en: None,
            variables: None,
            tags: Some(vec!["tag1".to_string()]),
            folder_id: None,
            images: None,
            videos: None,
            source: None,
            notes: None,
        }
    }

    #[test]
    fn test_create_prompt() {
        let conn = setup_test_db();
        let prompt = PromptDB::create(&conn, make_create_dto("Test Prompt")).unwrap();
        assert_eq!(prompt.title, "Test Prompt");
        assert_eq!(prompt.description.as_deref(), Some("desc"));
        assert_eq!(prompt.system_prompt.as_deref(), Some("system"));
        assert_eq!(prompt.user_prompt, "user prompt");
        assert!(!prompt.id.is_empty());
    }

    #[test]
    fn test_get_all_prompts() {
        let conn = setup_test_db();
        PromptDB::create(&conn, make_create_dto("A")).unwrap();
        PromptDB::create(&conn, make_create_dto("B")).unwrap();
        let all = PromptDB::get_all(&conn).unwrap();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_update_prompt() {
        let conn = setup_test_db();
        let prompt = PromptDB::create(&conn, make_create_dto("Original")).unwrap();
        let updated = PromptDB::update(
            &conn,
            &prompt.id,
            UpdatePromptDTO {
                title: Some("Updated".to_string()),
                description: None,
                prompt_type: None,
                system_prompt: None,
                system_prompt_en: None,
                user_prompt: None,
                user_prompt_en: None,
                variables: None,
                tags: None,
                folder_id: None,
                images: None,
                videos: None,
                is_favorite: Some(true),
                is_pinned: None,
                usage_count: None,
                source: None,
                notes: None,
                last_ai_response: None,
            },
        )
        .unwrap();
        assert_eq!(updated.title, "Updated");
        assert!(updated.is_favorite);
    }

    #[test]
    fn test_delete_prompt() {
        let conn = setup_test_db();
        let prompt = PromptDB::create(&conn, make_create_dto("ToDelete")).unwrap();
        let deleted = PromptDB::delete(&conn, &prompt.id).unwrap();
        assert!(deleted);
        let found = PromptDB::get_by_id(&conn, &prompt.id).unwrap();
        assert!(found.is_none());
    }

    #[test]
    fn test_search_prompts() {
        let conn = setup_test_db();
        PromptDB::create(&conn, make_create_dto("Unique Alpha")).unwrap();
        PromptDB::create(&conn, make_create_dto("Beta")).unwrap();
        let results = PromptDB::search(
            &conn,
            SearchQuery {
                keyword: Some("Alpha".to_string()),
                tags: None,
                folder_id: None,
                is_favorite: None,
                sort_by: None,
                sort_order: None,
                limit: None,
                offset: None,
            },
        )
        .unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].title, "Unique Alpha");
    }
}
