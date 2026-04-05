use crate::state::AppState;
use base64::{engine::general_purpose::STANDARD, Engine};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::State;
use uuid::Uuid;

fn images_dir(state: &AppState) -> PathBuf {
    PathBuf::from(&state.data_dir).join("images")
}

fn videos_dir(state: &AppState) -> PathBuf {
    PathBuf::from(&state.data_dir).join("videos")
}

fn ensure_dir(dir: &Path) -> Result<(), String> {
    if !dir.exists() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn validate_filename(file_name: &str, base_dir: &Path) -> Result<PathBuf, String> {
    let safe_name = Path::new(file_name).file_name().ok_or("Invalid filename")?;
    if safe_name.to_str() != Some(file_name) || file_name.contains("..") {
        return Err("Invalid filename: path traversal detected".into());
    }
    let full = base_dir.join(safe_name);
    if !full.starts_with(base_dir) {
        return Err("Invalid filename: path traversal detected".into());
    }
    Ok(full)
}

fn is_valid_external_url(url: &str) -> bool {
    let parsed = match url::Url::parse(url) {
        Ok(u) => u,
        Err(_) => return false,
    };

    match parsed.scheme() {
        "http" | "https" => {}
        _ => return false,
    }

    let host = match parsed.host_str() {
        Some(h) => h.to_lowercase(),
        None => return false,
    };

    if host == "localhost" || host == "127.0.0.1" || host == "::1" || host == "0.0.0.0" {
        return false;
    }

    if host.starts_with("10.")
        || host.starts_with("192.168.")
        || host.starts_with("0.")
        || host.ends_with(".local")
    {
        return false;
    }

    if host.starts_with("172.") {
        if let Some(second) = host.strip_prefix("172.") {
            if let Some(num_str) = second.split('.').next() {
                if let Ok(num) = num_str.parse::<u8>() {
                    if (16..=31).contains(&num) {
                        return false;
                    }
                }
            }
        }
    }

    if host.starts_with("169.254.") || host == "169.254.169.254" {
        return false;
    }

    if host.starts_with("fe80:") || host.starts_with("fc") || host.starts_with("fd") {
        return false;
    }

    true
}

#[tauri::command]
pub async fn image_save(
    state: State<'_, AppState>,
    file_paths: Vec<String>,
) -> Result<Vec<String>, String> {
    let dir = images_dir(&state);
    ensure_dir(&dir)?;

    let mut saved = Vec::new();
    for file_path in &file_paths {
        let src = Path::new(file_path);
        let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("png");
        let file_name = format!("{}.{}", Uuid::new_v4(), ext);
        let dest = dir.join(&file_name);
        if fs::copy(src, &dest).is_ok() {
            saved.push(file_name);
        }
    }
    Ok(saved)
}

#[tauri::command]
pub async fn image_save_buffer(
    state: State<'_, AppState>,
    buffer: Vec<u8>,
) -> Result<Option<String>, String> {
    let dir = images_dir(&state);
    ensure_dir(&dir)?;

    let file_name = format!("{}.png", Uuid::new_v4());
    let dest = dir.join(&file_name);
    fs::write(&dest, &buffer).map_err(|e| e.to_string())?;
    Ok(Some(file_name))
}

#[tauri::command]
pub async fn image_download(
    state: State<'_, AppState>,
    url: String,
) -> Result<Option<String>, String> {
    if !is_valid_external_url(&url) {
        return Err("Invalid or blocked URL".into());
    }

    let dir = images_dir(&state);
    ensure_dir(&dir)?;

    let response = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Ok(None);
    }
    let bytes = response.bytes().await.map_err(|e| e.to_string())?;

    let mut ext = Path::new(url.split('?').next().unwrap_or(&url))
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_string();
    if ext.len() > 5 {
        ext = "png".to_string();
    }

    let file_name = format!("{}.{}", Uuid::new_v4(), ext);
    let dest = dir.join(&file_name);
    fs::write(&dest, &bytes).map_err(|e| e.to_string())?;
    Ok(Some(file_name))
}

#[tauri::command]
pub async fn image_list(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let dir = images_dir(&state);
    if !dir.exists() {
        return Ok(vec![]);
    }

    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    let mut files = Vec::new();
    for entry in entries.flatten() {
        if let Some(name) = entry.file_name().to_str() {
            let lower = name.to_lowercase();
            if lower.ends_with(".jpg")
                || lower.ends_with(".jpeg")
                || lower.ends_with(".png")
                || lower.ends_with(".gif")
                || lower.ends_with(".webp")
            {
                files.push(name.to_string());
            }
        }
    }
    Ok(files)
}

#[tauri::command]
pub async fn image_get_size(
    state: State<'_, AppState>,
    file_name: String,
) -> Result<Option<u64>, String> {
    let dir = images_dir(&state);
    let path = validate_filename(&file_name, &dir)?;
    if !path.exists() {
        return Ok(None);
    }
    let meta = fs::metadata(&path).map_err(|e| e.to_string())?;
    Ok(Some(meta.len()))
}

#[tauri::command]
pub async fn image_read_base64(
    state: State<'_, AppState>,
    file_name: String,
) -> Result<Option<String>, String> {
    let dir = images_dir(&state);
    let path = validate_filename(&file_name, &dir)?;
    if !path.exists() {
        return Ok(None);
    }
    let data = fs::read(&path).map_err(|e| e.to_string())?;
    Ok(Some(STANDARD.encode(&data)))
}

#[tauri::command]
pub async fn image_save_base64(
    state: State<'_, AppState>,
    file_name: String,
    base64_data: String,
) -> Result<bool, String> {
    let dir = images_dir(&state);
    ensure_dir(&dir)?;
    let path = validate_filename(&file_name, &dir)?;
    if path.exists() {
        return Ok(true);
    }
    let data = STANDARD.decode(&base64_data).map_err(|e| e.to_string())?;
    fs::write(&path, &data).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub async fn image_exists(state: State<'_, AppState>, file_name: String) -> Result<bool, String> {
    let dir = images_dir(&state);
    match validate_filename(&file_name, &dir) {
        Ok(path) => Ok(path.exists()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn image_clear(state: State<'_, AppState>) -> Result<bool, String> {
    let dir = images_dir(&state);
    if !dir.exists() {
        return Ok(true);
    }
    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let _ = fs::remove_file(entry.path());
    }
    Ok(true)
}

#[tauri::command]
pub async fn image_get_path(
    state: State<'_, AppState>,
    file_name: String,
) -> Result<String, String> {
    let dir = images_dir(&state);
    let path = validate_filename(&file_name, &dir)?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn video_save(
    state: State<'_, AppState>,
    file_paths: Vec<String>,
) -> Result<Vec<String>, String> {
    let dir = videos_dir(&state);
    ensure_dir(&dir)?;

    let mut saved = Vec::new();
    for file_path in &file_paths {
        let src = Path::new(file_path);
        let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("mp4");
        let file_name = format!("{}.{}", Uuid::new_v4(), ext);
        let dest = dir.join(&file_name);
        if fs::copy(src, &dest).is_ok() {
            saved.push(file_name);
        }
    }
    Ok(saved)
}

#[tauri::command]
pub async fn video_list(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let dir = videos_dir(&state);
    if !dir.exists() {
        return Ok(vec![]);
    }

    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    let mut files = Vec::new();
    for entry in entries.flatten() {
        if let Some(name) = entry.file_name().to_str() {
            let lower = name.to_lowercase();
            if lower.ends_with(".mp4")
                || lower.ends_with(".webm")
                || lower.ends_with(".mov")
                || lower.ends_with(".avi")
                || lower.ends_with(".mkv")
            {
                files.push(name.to_string());
            }
        }
    }
    Ok(files)
}

#[tauri::command]
pub async fn video_get_size(
    state: State<'_, AppState>,
    file_name: String,
) -> Result<Option<u64>, String> {
    let dir = videos_dir(&state);
    let path = validate_filename(&file_name, &dir)?;
    if !path.exists() {
        return Ok(None);
    }
    let meta = fs::metadata(&path).map_err(|e| e.to_string())?;
    Ok(Some(meta.len()))
}

#[tauri::command]
pub async fn video_read_base64(
    state: State<'_, AppState>,
    file_name: String,
) -> Result<Option<String>, String> {
    let dir = videos_dir(&state);
    let path = validate_filename(&file_name, &dir)?;
    if !path.exists() {
        return Ok(None);
    }
    let data = fs::read(&path).map_err(|e| e.to_string())?;
    Ok(Some(STANDARD.encode(&data)))
}

#[tauri::command]
pub async fn video_save_base64(
    state: State<'_, AppState>,
    file_name: String,
    base64_data: String,
) -> Result<bool, String> {
    let dir = videos_dir(&state);
    ensure_dir(&dir)?;
    let path = validate_filename(&file_name, &dir)?;
    if path.exists() {
        return Ok(true);
    }
    let data = STANDARD.decode(&base64_data).map_err(|e| e.to_string())?;
    fs::write(&path, &data).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub async fn video_exists(state: State<'_, AppState>, file_name: String) -> Result<bool, String> {
    let dir = videos_dir(&state);
    match validate_filename(&file_name, &dir) {
        Ok(path) => Ok(path.exists()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn video_clear(state: State<'_, AppState>) -> Result<bool, String> {
    let dir = videos_dir(&state);
    if !dir.exists() {
        return Ok(true);
    }
    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let _ = fs::remove_file(entry.path());
    }
    Ok(true)
}

#[tauri::command]
pub async fn video_get_path(
    state: State<'_, AppState>,
    file_name: String,
) -> Result<String, String> {
    let dir = videos_dir(&state);
    let path = validate_filename(&file_name, &dir)?;
    Ok(path.to_string_lossy().to_string())
}
