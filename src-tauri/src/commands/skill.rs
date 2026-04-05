use tauri::State;
use crate::state::AppState;
use agentforge_core::models::skill::*;
use agentforge_core::database::skill::SkillDB;

#[tauri::command]
pub async fn skill_create(state: State<'_, AppState>, dto: CreateSkillDTO) -> Result<Skill, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::create(&db, dto).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_get(state: State<'_, AppState>, id: String) -> Result<Option<Skill>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::get_by_id(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_get_all(state: State<'_, AppState>) -> Result<Vec<Skill>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::get_all(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_update(state: State<'_, AppState>, id: String, dto: UpdateSkillDTO) -> Result<Skill, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::update(&db, &id, dto).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_delete(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::delete(&db, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_delete_all(state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::delete_all(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_search(state: State<'_, AppState>, query: String) -> Result<Vec<Skill>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::search(&db, &query).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_version_get_all(state: State<'_, AppState>, skill_id: String) -> Result<Vec<SkillVersion>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::version_get_all(&db, &skill_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_version_create(
    state: State<'_, AppState>,
    skill_id: String,
    note: Option<String>,
    files_snapshot: Option<Vec<SkillFileSnapshot>>,
) -> Result<SkillVersion, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::version_create(&db, &skill_id, note, files_snapshot).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_version_rollback(state: State<'_, AppState>, skill_id: String, version: i64) -> Result<Skill, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::version_rollback(&db, &skill_id, version).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_version_insert_direct(state: State<'_, AppState>, version: SkillVersion) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    SkillDB::version_insert_direct(&db, version).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_list_local_files(state: State<'_, AppState>, skill_id: String) -> Result<Vec<SkillLocalFileTreeEntry>, String> {
    let skills_dir = &state.skills_dir;
    let skill_dir = std::path::Path::new(skills_dir).join(&skill_id);

    if !skill_dir.exists() {
        return Ok(vec![]);
    }

    let mut entries = Vec::new();
    collect_file_tree(&skill_dir, &skill_dir, &mut entries)
        .map_err(|e| e.to_string())?;
    entries.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(entries)
}

fn collect_file_tree(
    base: &std::path::Path,
    dir: &std::path::Path,
    entries: &mut Vec<SkillLocalFileTreeEntry>,
) -> Result<(), std::io::Error> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let relative = path.strip_prefix(base).unwrap_or(&path);
        let relative_str = relative.to_string_lossy().replace('\\', "/");

        if relative_str.starts_with('.') || relative_str.contains("/.") {
            continue;
        }

        let metadata = entry.metadata()?;
        if metadata.is_dir() {
            entries.push(SkillLocalFileTreeEntry {
                path: relative_str.clone(),
                is_directory: true,
                size: None,
            });
            collect_file_tree(base, &path, entries)?;
        } else {
            entries.push(SkillLocalFileTreeEntry {
                path: relative_str,
                is_directory: false,
                size: Some(metadata.len()),
            });
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn skill_read_local_file(
    state: State<'_, AppState>,
    skill_id: String,
    relative_path: String,
) -> Result<Option<SkillLocalFileEntry>, String> {
    let skills_dir = &state.skills_dir;
    let file_path = std::path::Path::new(skills_dir)
        .join(&skill_id)
        .join(&relative_path);

    if !file_path.exists() {
        return Ok(None);
    }

    let content = std::fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    Ok(Some(SkillLocalFileEntry {
        path: relative_path,
        content,
        is_directory: false,
    }))
}

#[tauri::command]
pub async fn skill_read_local_files(state: State<'_, AppState>, skill_id: String) -> Result<Vec<SkillLocalFileEntry>, String> {
    let skills_dir = &state.skills_dir;
    let skill_dir = std::path::Path::new(skills_dir).join(&skill_id);

    if !skill_dir.exists() {
        return Ok(vec![]);
    }

    let mut entries = Vec::new();
    collect_file_contents(&skill_dir, &skill_dir, &mut entries)
        .map_err(|e| e.to_string())?;
    Ok(entries)
}

fn collect_file_contents(
    base: &std::path::Path,
    dir: &std::path::Path,
    entries: &mut Vec<SkillLocalFileEntry>,
) -> Result<(), std::io::Error> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let relative = path.strip_prefix(base).unwrap_or(&path);
        let relative_str = relative.to_string_lossy().replace('\\', "/");

        if relative_str.starts_with('.') || relative_str.contains("/.") {
            continue;
        }

        if path.is_dir() {
            collect_file_contents(base, &path, entries)?;
        } else if let Ok(content) = std::fs::read_to_string(&path) {
            entries.push(SkillLocalFileEntry {
                path: relative_str,
                content,
                is_directory: false,
            });
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn skill_write_local_file(
    state: State<'_, AppState>,
    skill_id: String,
    relative_path: String,
    content: String,
) -> Result<(), String> {
    let skills_dir = &state.skills_dir;
    let file_path = std::path::Path::new(skills_dir)
        .join(&skill_id)
        .join(&relative_path);

    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    std::fs::write(&file_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_delete_local_file(
    state: State<'_, AppState>,
    skill_id: String,
    relative_path: String,
) -> Result<bool, String> {
    let skills_dir = &state.skills_dir;
    let file_path = std::path::Path::new(skills_dir)
        .join(&skill_id)
        .join(&relative_path);

    if !file_path.exists() {
        return Ok(false);
    }

    if file_path.is_dir() {
        std::fs::remove_dir_all(&file_path).map_err(|e| e.to_string())?;
    } else {
        std::fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    }
    Ok(true)
}

#[tauri::command]
pub async fn skill_create_local_dir(
    state: State<'_, AppState>,
    skill_id: String,
    relative_path: String,
) -> Result<(), String> {
    let skills_dir = &state.skills_dir;
    let dir_path = std::path::Path::new(skills_dir)
        .join(&skill_id)
        .join(&relative_path);

    std::fs::create_dir_all(&dir_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_get_repo_path(state: State<'_, AppState>, skill_id: String) -> Result<Option<String>, String> {
    let skills_dir = &state.skills_dir;
    let skill_dir = std::path::Path::new(skills_dir).join(&skill_id);

    if skill_dir.exists() {
        Ok(Some(skill_dir.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn skill_save_to_repo(
    state: State<'_, AppState>,
    skill_name: String,
    source_dir: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let skill = SkillDB::get_by_name(&db, &skill_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Skill not found: {}", skill_name))?;

    let skills_dir = &state.skills_dir;
    let dest_dir = std::path::Path::new(skills_dir).join(&skill.id);
    std::fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;

    let source = std::path::Path::new(&source_dir);
    if source.is_dir() {
        copy_dir_recursive(source, &dest_dir).map_err(|e| e.to_string())?;
    }

    Ok(dest_dir.to_string_lossy().to_string())
}

fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> Result<(), std::io::Error> {
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let path = entry.path();
        let file_name = entry.file_name();
        let file_name_str = file_name.to_string_lossy();

        if file_name_str.starts_with('.') {
            continue;
        }

        let dest_path = dst.join(&file_name);
        if path.is_dir() {
            std::fs::create_dir_all(&dest_path)?;
            copy_dir_recursive(&path, &dest_path)?;
        } else {
            std::fs::copy(&path, &dest_path)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn skill_rename_local_path(
    state: State<'_, AppState>,
    skill_id: String,
    old_relative_path: String,
    new_relative_path: String,
) -> Result<(), String> {
    let skills_dir = &state.skills_dir;
    let old_path = std::path::Path::new(skills_dir)
        .join(&skill_id)
        .join(&old_relative_path);
    let new_path = std::path::Path::new(skills_dir)
        .join(&skill_id)
        .join(&new_relative_path);

    if !old_path.exists() {
        return Err(format!("Path not found: {}", old_relative_path));
    }

    if let Some(parent) = new_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    std::fs::rename(&old_path, &new_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skill_fetch_remote_content(url: String) -> Result<String, String> {
    if is_private_ip(&url) {
        return Err("SSRF protection: requests to private/local addresses are blocked".to_string());
    }

    let client = reqwest::Client::builder()
        .user_agent("AgentForge/1.0")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("HTTP {} for {}", status.as_u16(), url));
    }

    let text = response.text().await.map_err(|e| e.to_string())?;
    Ok(text)
}

fn is_private_ip(url: &str) -> bool {
    if let Ok(parsed) = url::Url::parse(url) {
        if let Some(host) = parsed.host_str() {
            let lower = host.to_lowercase();
            if lower == "localhost"
                || lower == "127.0.0.1"
                || lower == "::1"
                || lower == "0.0.0.0"
                || lower.starts_with("10.")
                || lower.starts_with("192.168.")
                || lower.ends_with(".local")
            {
                return true;
            }
            if lower.starts_with("172.") {
                if let Some(second) = lower.strip_prefix("172.") {
                    if let Some(num_str) = second.split('.').next() {
                        if let Ok(num) = num_str.parse::<u8>() {
                            if (16..=31).contains(&num) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    false
}
