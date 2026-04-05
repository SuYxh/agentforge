use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, Row};
use uuid::Uuid;

use crate::error::AppError;
use crate::models::skill::*;

pub struct SkillDB;

fn millis_to_iso(millis: i64) -> String {
    DateTime::from_timestamp_millis(millis)
        .unwrap_or_default()
        .to_rfc3339()
}

fn parse_json_array(value: Option<String>) -> Option<Vec<String>> {
    value
        .as_deref()
        .filter(|s| !s.is_empty())
        .and_then(|s| serde_json::from_str(s).ok())
}

fn row_to_skill(row: &Row) -> Result<Skill, rusqlite::Error> {
    let tags_json: Option<String> = row.get("tags")?;
    let original_tags_json: Option<String> = row.get("original_tags")?;
    let prerequisites_json: Option<String> = row.get("prerequisites")?;
    let compatibility_json: Option<String> = row.get("compatibility")?;
    let is_favorite_int: i64 = row.get("is_favorite")?;
    let is_builtin_int: i64 = row.get::<_, Option<i64>>("is_builtin")?.unwrap_or(0);
    let current_version: Option<i64> = row.get("current_version")?;
    let version_tracking_enabled: Option<i64> = row.get("version_tracking_enabled")?;
    let content: Option<String> = row.get("content")?;

    Ok(Skill {
        id: row.get("id")?,
        name: row.get("name")?,
        description: row.get("description")?,
        content: content.clone(),
        instructions: content,
        mcp_config: row.get("mcp_config")?,
        protocol_type: row.get::<_, Option<String>>("protocol_type")?.unwrap_or_else(|| "mcp".to_string()),
        version: row.get("version")?,
        author: row.get("author")?,
        source_url: row.get("source_url")?,
        local_repo_path: row.get("local_repo_path")?,
        tags: parse_json_array(tags_json),
        original_tags: parse_json_array(original_tags_json),
        is_favorite: is_favorite_int != 0,
        current_version,
        version_tracking_enabled: version_tracking_enabled.map(|v| v != 0),
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        icon_url: row.get("icon_url")?,
        icon_emoji: row.get("icon_emoji")?,
        icon_background: row.get("icon_background")?,
        category: row.get("category")?,
        is_builtin: Some(is_builtin_int != 0),
        registry_slug: row.get("registry_slug")?,
        content_url: row.get("content_url")?,
        prerequisites: parse_json_array(prerequisites_json),
        compatibility: parse_json_array(compatibility_json),
    })
}

fn row_to_skill_version(row: &Row) -> Result<SkillVersion, rusqlite::Error> {
    let files_snapshot_json: Option<String> = row.get("files_snapshot")?;
    let files_snapshot: Option<Vec<SkillFileSnapshot>> = files_snapshot_json
        .as_deref()
        .filter(|s| !s.is_empty())
        .and_then(|s| serde_json::from_str(s).ok());
    let created_at_millis: i64 = row.get("created_at")?;

    Ok(SkillVersion {
        id: row.get("id")?,
        skill_id: row.get("skill_id")?,
        version: row.get("version")?,
        content: row.get("content")?,
        files_snapshot,
        note: row.get("note")?,
        created_at: millis_to_iso(created_at_millis),
    })
}

impl SkillDB {
    pub fn create(conn: &Connection, dto: CreateSkillDTO) -> Result<Skill, AppError> {
        let normalized_name = dto.name.trim().to_string();
        if normalized_name.is_empty() {
            return Err(AppError::Validation("Skill name is required".to_string()));
        }

        if let Some(existing) = Self::get_by_name(conn, &normalized_name)? {
            if dto.overwrite_existing == Some(true) {
                let update_dto = UpdateSkillDTO {
                    name: Some(normalized_name),
                    description: dto.description,
                    instructions: dto.instructions,
                    content: dto.content,
                    mcp_config: dto.mcp_config,
                    protocol_type: dto.protocol_type,
                    version: dto.version,
                    author: dto.author,
                    source_url: dto.source_url,
                    local_repo_path: dto.local_repo_path,
                    tags: dto.tags,
                    original_tags: dto.original_tags,
                    is_favorite: dto.is_favorite,
                    icon_url: dto.icon_url,
                    icon_emoji: dto.icon_emoji,
                    icon_background: dto.icon_background,
                    category: dto.category,
                    is_builtin: dto.is_builtin,
                    registry_slug: dto.registry_slug,
                    content_url: dto.content_url,
                    prerequisites: dto.prerequisites,
                    compatibility: dto.compatibility,
                    current_version: dto.current_version,
                    version_tracking_enabled: dto.version_tracking_enabled,
                };
                return Self::update(conn, &existing.id, update_dto);
            }
            return Err(AppError::Validation(format!("Skill already exists: {}", normalized_name)));
        }

        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        let effective_content = dto.content
            .or(dto.instructions)
            .unwrap_or_default();
        let tags_json = serde_json::to_string(&dto.tags.unwrap_or_default())?;
        let original_tags_json = dto.original_tags
            .map(|t| serde_json::to_string(&t).unwrap_or_else(|_| tags_json.clone()))
            .unwrap_or_else(|| tags_json.clone());
        let prerequisites_json: Option<String> = dto.prerequisites
            .map(|p| serde_json::to_string(&p).unwrap_or_else(|_| "[]".to_string()));
        let compatibility_json: Option<String> = dto.compatibility
            .map(|c| serde_json::to_string(&c).unwrap_or_else(|_| "[]".to_string()));

        conn.execute(
            "INSERT INTO skills (
                id, name, description, content, mcp_config,
                protocol_type, version, author, tags, original_tags, is_favorite,
                source_url, local_repo_path, icon_url, icon_emoji, icon_background,
                category, is_builtin, registry_slug, content_url,
                prerequisites, compatibility,
                current_version, version_tracking_enabled,
                created_at, updated_at
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5,
                ?6, ?7, ?8, ?9, ?10, ?11,
                ?12, ?13, ?14, ?15, ?16,
                ?17, ?18, ?19, ?20,
                ?21, ?22,
                ?23, ?24,
                ?25, ?26
            )",
            params![
                id,
                normalized_name,
                dto.description,
                effective_content,
                dto.mcp_config,
                dto.protocol_type.unwrap_or_else(|| "mcp".to_string()),
                dto.version.unwrap_or_else(|| "1.0.0".to_string()),
                dto.author.unwrap_or_else(|| "User".to_string()),
                tags_json,
                original_tags_json,
                if dto.is_favorite == Some(true) { 1i64 } else { 0i64 },
                dto.source_url,
                dto.local_repo_path,
                dto.icon_url,
                dto.icon_emoji,
                dto.icon_background,
                dto.category.unwrap_or_else(|| "general".to_string()),
                if dto.is_builtin == Some(true) { 1i64 } else { 0i64 },
                dto.registry_slug,
                dto.content_url,
                prerequisites_json,
                compatibility_json,
                dto.current_version.unwrap_or(0),
                if dto.version_tracking_enabled.unwrap_or(true) { 1i64 } else { 0i64 },
                now,
                now,
            ],
        )?;

        Self::get_by_id(conn, &id)?
            .ok_or_else(|| AppError::NotFound("Skill not found after creation".to_string()))
    }

    pub fn get_by_id(conn: &Connection, id: &str) -> Result<Option<Skill>, AppError> {
        let mut stmt = conn.prepare("SELECT * FROM skills WHERE id = ?1")?;
        let mut rows = stmt.query_map(params![id], row_to_skill)?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn get_by_name(conn: &Connection, name: &str) -> Result<Option<Skill>, AppError> {
        let mut stmt = conn.prepare("SELECT * FROM skills WHERE LOWER(name) = LOWER(?1)")?;
        let mut rows = stmt.query_map(params![name], row_to_skill)?;
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    pub fn get_all(conn: &Connection) -> Result<Vec<Skill>, AppError> {
        let mut stmt = conn.prepare("SELECT * FROM skills ORDER BY updated_at DESC")?;
        let rows = stmt.query_map([], row_to_skill)?;
        let mut skills = Vec::new();
        for row in rows {
            skills.push(row?);
        }
        Ok(skills)
    }

    pub fn update(conn: &Connection, id: &str, dto: UpdateSkillDTO) -> Result<Skill, AppError> {
        let now = Utc::now().timestamp_millis();
        let mut set_clauses = vec!["updated_at = ?1".to_string()];
        let mut param_index: usize = 2;

        enum ParamValue {
            Text(String),
            OptText(Option<String>),
            Int(i64),
        }

        let mut param_values: Vec<ParamValue> = vec![];

        macro_rules! add_text {
            ($field:expr, $col:expr) => {
                if let Some(val) = $field {
                    set_clauses.push(format!("{} = ?{}", $col, param_index));
                    param_values.push(ParamValue::Text(val));
                    param_index += 1;
                }
            };
        }

        macro_rules! add_opt_text {
            ($field:expr, $col:expr) => {
                if let Some(val) = $field {
                    set_clauses.push(format!("{} = ?{}", $col, param_index));
                    param_values.push(ParamValue::OptText(val));
                    param_index += 1;
                }
            };
        }

        if let Some(ref name) = dto.name {
            let trimmed = name.trim().to_string();
            if trimmed.is_empty() {
                return Err(AppError::Validation("Skill name cannot be empty".to_string()));
            }
            if let Some(dup) = Self::get_by_name(conn, &trimmed)? {
                if dup.id != id {
                    return Err(AppError::Validation(format!("Skill already exists: {}", trimmed)));
                }
            }
            set_clauses.push(format!("name = ?{}", param_index));
            param_values.push(ParamValue::Text(trimmed));
            param_index += 1;
        }

        add_text!(dto.description, "description");

        if dto.instructions.is_some() {
            add_text!(dto.instructions, "content");
        } else if dto.content.is_some() {
            add_text!(dto.content, "content");
        }

        add_text!(dto.mcp_config, "mcp_config");
        add_text!(dto.protocol_type, "protocol_type");
        add_text!(dto.version, "version");
        add_text!(dto.author, "author");
        add_opt_text!(dto.source_url.map(Some), "source_url");
        add_opt_text!(dto.local_repo_path.map(Some), "local_repo_path");
        add_opt_text!(dto.icon_url.map(Some), "icon_url");
        add_opt_text!(dto.icon_emoji.map(Some), "icon_emoji");
        add_opt_text!(dto.icon_background.map(Some), "icon_background");
        add_text!(dto.category, "category");
        add_opt_text!(dto.registry_slug.map(Some), "registry_slug");
        add_opt_text!(dto.content_url.map(Some), "content_url");

        if let Some(ref tags) = dto.tags {
            let json = serde_json::to_string(tags)?;
            set_clauses.push(format!("tags = ?{}", param_index));
            param_values.push(ParamValue::Text(json));
            param_index += 1;
        }

        if let Some(ref original_tags) = dto.original_tags {
            let json = serde_json::to_string(original_tags)?;
            set_clauses.push(format!("original_tags = ?{}", param_index));
            param_values.push(ParamValue::Text(json));
            param_index += 1;
        }

        if let Some(ref prerequisites) = dto.prerequisites {
            let json = serde_json::to_string(prerequisites)?;
            set_clauses.push(format!("prerequisites = ?{}", param_index));
            param_values.push(ParamValue::Text(json));
            param_index += 1;
        }

        if let Some(ref compatibility) = dto.compatibility {
            let json = serde_json::to_string(compatibility)?;
            set_clauses.push(format!("compatibility = ?{}", param_index));
            param_values.push(ParamValue::Text(json));
            param_index += 1;
        }

        if let Some(fav) = dto.is_favorite {
            set_clauses.push(format!("is_favorite = ?{}", param_index));
            param_values.push(ParamValue::Int(if fav { 1 } else { 0 }));
            param_index += 1;
        }

        if let Some(builtin) = dto.is_builtin {
            set_clauses.push(format!("is_builtin = ?{}", param_index));
            param_values.push(ParamValue::Int(if builtin { 1 } else { 0 }));
            param_index += 1;
        }

        if let Some(cv) = dto.current_version {
            set_clauses.push(format!("current_version = ?{}", param_index));
            param_values.push(ParamValue::Int(cv));
            param_index += 1;
        }

        if let Some(vte) = dto.version_tracking_enabled {
            set_clauses.push(format!("version_tracking_enabled = ?{}", param_index));
            param_values.push(ParamValue::Int(if vte { 1 } else { 0 }));
            param_index += 1;
        }

        let sql = format!(
            "UPDATE skills SET {} WHERE id = ?{}",
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
            .ok_or_else(|| AppError::NotFound(format!("Skill not found: {}", id)))
    }

    pub fn delete(conn: &Connection, id: &str) -> Result<bool, AppError> {
        let affected = conn.execute("DELETE FROM skills WHERE id = ?1", params![id])?;
        Ok(affected > 0)
    }

    pub fn delete_all(conn: &Connection) -> Result<(), AppError> {
        conn.execute("DELETE FROM skill_versions", [])?;
        conn.execute("DELETE FROM skills", [])?;
        Ok(())
    }

    pub fn search(conn: &Connection, query: &str) -> Result<Vec<Skill>, AppError> {
        let pattern = format!("%{}%", query);
        let mut stmt = conn.prepare(
            "SELECT * FROM skills WHERE name LIKE ?1 OR description LIKE ?1 OR tags LIKE ?1 ORDER BY updated_at DESC"
        )?;
        let rows = stmt.query_map(params![pattern], row_to_skill)?;
        let mut skills = Vec::new();
        for row in rows {
            skills.push(row?);
        }
        Ok(skills)
    }

    pub fn version_get_all(conn: &Connection, skill_id: &str) -> Result<Vec<SkillVersion>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT * FROM skill_versions WHERE skill_id = ?1 ORDER BY version DESC"
        )?;
        let rows = stmt.query_map(params![skill_id], row_to_skill_version)?;
        let mut versions = Vec::new();
        for row in rows {
            versions.push(row?);
        }
        Ok(versions)
    }

    pub fn version_create(
        conn: &Connection,
        skill_id: &str,
        note: Option<String>,
        files_snapshot: Option<Vec<SkillFileSnapshot>>,
    ) -> Result<SkillVersion, AppError> {
        let skill = Self::get_by_id(conn, skill_id)?
            .ok_or_else(|| AppError::NotFound(format!("Skill not found: {}", skill_id)))?;

        let max_version: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(version), 0) FROM skill_versions WHERE skill_id = ?1",
                params![skill_id],
                |row| row.get(0),
            )
            .unwrap_or(0);

        let new_version = max_version + 1;
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().timestamp_millis();

        let files_snapshot_json: Option<String> = files_snapshot
            .as_ref()
            .map(|fs| serde_json::to_string(fs).unwrap_or_else(|_| "[]".to_string()));

        conn.execute(
            "INSERT INTO skill_versions (id, skill_id, version, content, files_snapshot, note, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, skill_id, new_version, skill.content, files_snapshot_json, note, now],
        )?;

        conn.execute(
            "UPDATE skills SET current_version = ?1, version_tracking_enabled = 1 WHERE id = ?2",
            params![new_version, skill_id],
        )?;

        Ok(SkillVersion {
            id,
            skill_id: skill_id.to_string(),
            version: new_version,
            content: skill.content,
            files_snapshot,
            note,
            created_at: millis_to_iso(now),
        })
    }

    pub fn version_rollback(conn: &Connection, skill_id: &str, version: i64) -> Result<Skill, AppError> {
        let mut stmt = conn.prepare(
            "SELECT * FROM skill_versions WHERE skill_id = ?1 AND version = ?2"
        )?;
        let ver = stmt
            .query_row(params![skill_id, version], row_to_skill_version)
            .map_err(|_| {
                AppError::NotFound(format!("Version {} not found for skill {}", version, skill_id))
            })?;

        let now = Utc::now().timestamp_millis();
        conn.execute(
            "UPDATE skills SET content = ?1, updated_at = ?2 WHERE id = ?3",
            params![ver.content, now, skill_id],
        )?;

        Self::get_by_id(conn, skill_id)?
            .ok_or_else(|| AppError::NotFound(format!("Skill not found: {}", skill_id)))
    }

    pub fn version_insert_direct(conn: &Connection, version: SkillVersion) -> Result<(), AppError> {
        let files_snapshot_json: Option<String> = version
            .files_snapshot
            .as_ref()
            .map(|fs| serde_json::to_string(fs).unwrap_or_else(|_| "[]".to_string()));

        let created_at_millis = chrono::DateTime::parse_from_rfc3339(&version.created_at)
            .map(|dt| dt.timestamp_millis())
            .unwrap_or_else(|_| Utc::now().timestamp_millis());

        conn.execute(
            "INSERT OR IGNORE INTO skill_versions (id, skill_id, version, content, files_snapshot, note, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                version.id,
                version.skill_id,
                version.version,
                version.content,
                files_snapshot_json,
                version.note,
                created_at_millis,
            ],
        )?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::skill::CreateSkillDTO;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA journal_mode=WAL;").unwrap();
        conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        crate::database::schema::migrate(&conn).unwrap();
        conn
    }

    fn make_skill_dto(name: &str) -> CreateSkillDTO {
        CreateSkillDTO {
            name: name.to_string(),
            description: Some("A test skill".to_string()),
            instructions: Some("Do things".to_string()),
            content: None,
            mcp_config: None,
            protocol_type: None,
            version: None,
            author: None,
            source_url: None,
            local_repo_path: None,
            tags: Some(vec!["test".to_string()]),
            original_tags: None,
            is_favorite: None,
            icon_url: None,
            icon_emoji: None,
            icon_background: None,
            category: None,
            is_builtin: None,
            registry_slug: None,
            content_url: None,
            prerequisites: None,
            compatibility: None,
            current_version: None,
            version_tracking_enabled: None,
            skip_initial_version: None,
            overwrite_existing: None,
        }
    }

    #[test]
    fn test_create_skill() {
        let conn = setup_test_db();
        let skill = SkillDB::create(&conn, make_skill_dto("test-skill")).unwrap();
        assert_eq!(skill.name, "test-skill");
        assert_eq!(skill.description.as_deref(), Some("A test skill"));
        assert!(!skill.id.is_empty());
    }

    #[test]
    fn test_get_all_skills() {
        let conn = setup_test_db();
        SkillDB::create(&conn, make_skill_dto("skill-a")).unwrap();
        SkillDB::create(&conn, make_skill_dto("skill-b")).unwrap();
        let all = SkillDB::get_all(&conn).unwrap();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_search_skills() {
        let conn = setup_test_db();
        SkillDB::create(&conn, make_skill_dto("alpha-skill")).unwrap();
        SkillDB::create(&conn, make_skill_dto("beta-skill")).unwrap();
        let results = SkillDB::search(&conn, "alpha").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].name, "alpha-skill");
    }

    #[test]
    fn test_delete_skill() {
        let conn = setup_test_db();
        let skill = SkillDB::create(&conn, make_skill_dto("to-delete")).unwrap();
        let deleted = SkillDB::delete(&conn, &skill.id).unwrap();
        assert!(deleted);
        let found = SkillDB::get_by_id(&conn, &skill.id).unwrap();
        assert!(found.is_none());
    }
}
