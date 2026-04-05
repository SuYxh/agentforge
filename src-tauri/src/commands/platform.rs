use crate::state::AppState;
use agentforge_core::database::skill::SkillDB;
use agentforge_core::services::platforms;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformInfo {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub skills_dir: String,
    pub detected: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillInstallStatus {
    pub platform_id: String,
    pub installed: bool,
    pub install_mode: Option<String>,
}

fn platform_to_info(p: &platforms::SkillPlatform, detected: bool) -> PlatformInfo {
    PlatformInfo {
        id: p.id.clone(),
        name: p.name.clone(),
        icon: p.icon.clone(),
        skills_dir: platforms::resolve_platform_path(p),
        detected,
    }
}

#[tauri::command]
pub async fn platform_get_all() -> Result<Vec<PlatformInfo>, String> {
    let all = platforms::get_all_platforms();
    let detected_ids: Vec<String> = platforms::detect_installed_platforms()
        .iter()
        .map(|p| p.id.clone())
        .collect();

    Ok(all
        .iter()
        .map(|p| platform_to_info(p, detected_ids.contains(&p.id)))
        .collect())
}

#[tauri::command]
pub async fn platform_detect_installed() -> Result<Vec<String>, String> {
    Ok(platforms::detect_installed_platforms()
        .iter()
        .map(|p| p.id.clone())
        .collect())
}

#[tauri::command]
pub async fn platform_install_skill(
    state: State<'_, AppState>,
    skill_id: String,
    platform_id: String,
    install_mode: String,
) -> Result<(), String> {
    let db = state
        .db
        .lock()
        .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
    let skill = SkillDB::get_by_id(&db, &skill_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Skill not found: {}", skill_id))?;

    let platform = platforms::get_platform_by_id(&platform_id)
        .ok_or_else(|| format!("Platform not found: {}", platform_id))?;

    let platform_skills_dir = platforms::resolve_platform_path(&platform);
    let safe_name = sanitize_skill_name(&skill.name);
    let skill_dir = std::path::Path::new(&platform_skills_dir).join(&safe_name);
    std::fs::create_dir_all(&skill_dir).map_err(|e| e.to_string())?;

    let skill_md_path = skill_dir.join("SKILL.md");
    let content = build_skill_md(&skill);

    if install_mode == "symlink" {
        let source_md = std::path::Path::new(&state.skills_dir)
            .join(&skill_id)
            .join("SKILL.md");

        if !source_md.exists() {
            if let Some(parent) = source_md.parent() {
                std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            std::fs::write(&source_md, &content).map_err(|e| e.to_string())?;
        }

        if skill_md_path.exists() || skill_md_path.is_symlink() {
            std::fs::remove_file(&skill_md_path).map_err(|e| e.to_string())?;
        }

        #[cfg(unix)]
        std::os::unix::fs::symlink(&source_md, &skill_md_path).map_err(|e| e.to_string())?;

        #[cfg(windows)]
        std::os::windows::fs::symlink_file(&source_md, &skill_md_path)
            .map_err(|e| e.to_string())?;
    } else {
        std::fs::write(&skill_md_path, content).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn platform_uninstall_skill(
    skill_name: String,
    platform_id: String,
) -> Result<bool, String> {
    let platform = platforms::get_platform_by_id(&platform_id)
        .ok_or_else(|| format!("Platform not found: {}", platform_id))?;

    let platform_skills_dir = platforms::resolve_platform_path(&platform);
    let safe_name = sanitize_skill_name(&skill_name);
    let skill_dir = std::path::Path::new(&platform_skills_dir).join(&safe_name);

    if !skill_dir.exists() {
        return Ok(false);
    }

    std::fs::remove_dir_all(&skill_dir).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub async fn platform_check_skill_status(
    skill_name: String,
    platform_ids: Vec<String>,
) -> Result<Vec<SkillInstallStatus>, String> {
    let safe_name = sanitize_skill_name(&skill_name);
    let mut results = Vec::new();

    for pid in &platform_ids {
        let platform = match platforms::get_platform_by_id(pid) {
            Some(p) => p,
            None => {
                results.push(SkillInstallStatus {
                    platform_id: pid.clone(),
                    installed: false,
                    install_mode: None,
                });
                continue;
            }
        };

        let platform_skills_dir = platforms::resolve_platform_path(&platform);
        let skill_md = std::path::Path::new(&platform_skills_dir)
            .join(&safe_name)
            .join("SKILL.md");

        if skill_md.exists() || skill_md.is_symlink() {
            let mode = if skill_md.is_symlink() {
                "symlink".to_string()
            } else {
                "copy".to_string()
            };
            results.push(SkillInstallStatus {
                platform_id: pid.clone(),
                installed: true,
                install_mode: Some(mode),
            });
        } else {
            results.push(SkillInstallStatus {
                platform_id: pid.clone(),
                installed: false,
                install_mode: None,
            });
        }
    }

    Ok(results)
}

#[tauri::command]
pub async fn platform_get_all_deployed_skills() -> Result<Vec<String>, String> {
    let detected = platforms::detect_installed_platforms();
    let mut deployed_names = std::collections::HashSet::new();

    for platform in &detected {
        let dir = platforms::resolve_platform_path(platform);
        let path = std::path::Path::new(&dir);
        if !path.exists() {
            continue;
        }
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                if entry.path().is_dir() {
                    let skill_md = entry.path().join("SKILL.md");
                    if skill_md.exists() || skill_md.is_symlink() {
                        if let Some(name) = entry.file_name().to_str() {
                            deployed_names.insert(name.to_string());
                        }
                    }
                }
            }
        }
    }

    Ok(deployed_names.into_iter().collect())
}

fn sanitize_skill_name(name: &str) -> String {
    name.chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        })
        .collect::<String>()
        .trim()
        .to_string()
}

fn build_skill_md(skill: &agentforge_core::models::skill::Skill) -> String {
    let mut md = String::new();

    md.push_str("---\n");
    md.push_str(&format!("name: \"{}\"\n", skill.name));
    if let Some(desc) = &skill.description {
        md.push_str(&format!("description: \"{}\"\n", desc));
    }
    if let Some(ver) = &skill.version {
        md.push_str(&format!("version: \"{}\"\n", ver));
    }
    if let Some(author) = &skill.author {
        md.push_str(&format!("author: \"{}\"\n", author));
    }
    if let Some(tags) = &skill.tags {
        if !tags.is_empty() {
            md.push_str(&format!(
                "tags: [{}]\n",
                tags.iter()
                    .map(|t| format!("\"{}\"", t))
                    .collect::<Vec<_>>()
                    .join(", ")
            ));
        }
    }
    md.push_str("---\n\n");

    if let Some(content) = &skill.content {
        if !content.is_empty() {
            md.push_str(content);
            return md;
        }
    }
    if let Some(instructions) = &skill.instructions {
        md.push_str(instructions);
    }

    md
}
