use agentforge_core::services::webdav::{WebDavClient, WebDavConfig, WebDavResponse};

#[tauri::command]
pub async fn webdav_test_connection(config: WebDavConfig) -> Result<WebDavResponse, String> {
    let client = WebDavClient::new();
    Ok(client.test_connection(&config).await)
}

#[tauri::command]
pub async fn webdav_ensure_directory(
    url: String,
    config: WebDavConfig,
) -> Result<WebDavResponse, String> {
    let client = WebDavClient::new();
    Ok(client.ensure_directory(&url, &config).await)
}

#[tauri::command]
pub async fn webdav_upload(
    file_url: String,
    config: WebDavConfig,
    data: String,
) -> Result<WebDavResponse, String> {
    let client = WebDavClient::new();
    Ok(client.upload(&file_url, &config, &data).await)
}

#[tauri::command]
pub async fn webdav_stat(
    file_url: String,
    config: WebDavConfig,
) -> Result<WebDavResponse, String> {
    let client = WebDavClient::new();
    Ok(client.stat(&file_url, &config).await)
}

#[tauri::command]
pub async fn webdav_download(
    file_url: String,
    config: WebDavConfig,
) -> Result<WebDavResponse, String> {
    let client = WebDavClient::new();
    Ok(client.download(&file_url, &config).await)
}

#[tauri::command]
pub async fn webdav_delete(
    file_url: String,
    config: WebDavConfig,
) -> Result<WebDavResponse, String> {
    let client = WebDavClient::new();
    Ok(client.delete(&file_url, &config).await)
}
