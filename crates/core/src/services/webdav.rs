use base64::{engine::general_purpose::STANDARD, Engine};
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WebDavConfig {
    pub url: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebDavResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_modified: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub not_found: Option<bool>,
}

pub struct WebDavClient {
    client: Client,
}

impl WebDavClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    fn build_auth(config: &WebDavConfig) -> String {
        format!(
            "Basic {}",
            STANDARD.encode(format!("{}:{}", config.username, config.password))
        )
    }

    async fn request(
        &self,
        method: &str,
        url: &str,
        auth: &str,
        headers: &[(&str, &str)],
        body: Option<&str>,
    ) -> WebDavResponse {
        let req_method = match reqwest::Method::from_bytes(method.as_bytes()) {
            Ok(m) => m,
            Err(e) => {
                return WebDavResponse {
                    success: false,
                    status: None,
                    data: None,
                    error: Some(e.to_string()),
                    last_modified: None,
                    not_found: None,
                };
            }
        };

        let mut builder = self
            .client
            .request(req_method, url)
            .header("Authorization", auth)
            .header("User-Agent", "AgentForge/1.0");

        for (key, value) in headers {
            builder = builder.header(*key, *value);
        }

        if let Some(body_str) = body {
            builder = builder.body(body_str.to_string());
        }

        match builder.send().await {
            Ok(response) => {
                let status = response.status().as_u16();
                let success = status >= 200 && status < 400;
                match response.text().await {
                    Ok(text) => WebDavResponse {
                        success,
                        status: Some(status),
                        data: Some(text),
                        error: None,
                        last_modified: None,
                        not_found: None,
                    },
                    Err(e) => WebDavResponse {
                        success: false,
                        status: Some(status),
                        data: None,
                        error: Some(e.to_string()),
                        last_modified: None,
                        not_found: None,
                    },
                }
            }
            Err(e) => WebDavResponse {
                success: false,
                status: None,
                data: None,
                error: Some(e.to_string()),
                last_modified: None,
                not_found: None,
            },
        }
    }

    pub async fn test_connection(&self, config: &WebDavConfig) -> WebDavResponse {
        let auth = Self::build_auth(config);
        let response = self
            .request("PROPFIND", &config.url, &auth, &[("Depth", "0")], None)
            .await;

        if response.success || response.status == Some(207) {
            WebDavResponse {
                success: true,
                status: response.status,
                data: Some("Connection successful".to_string()),
                error: None,
                last_modified: None,
                not_found: None,
            }
        } else if response.status == Some(401) {
            WebDavResponse {
                success: false,
                status: response.status,
                data: None,
                error: Some(
                    "Authentication failed, please check username and password".to_string(),
                ),
                last_modified: None,
                not_found: None,
            }
        } else {
            WebDavResponse {
                success: false,
                status: response.status,
                data: None,
                error: Some(format!(
                    "Connection failed: {} {}",
                    response.status.unwrap_or(0),
                    response.error.unwrap_or_default()
                )),
                last_modified: None,
                not_found: None,
            }
        }
    }

    pub async fn ensure_directory(&self, url: &str, config: &WebDavConfig) -> WebDavResponse {
        let auth = Self::build_auth(config);

        let check_res = self
            .request("PROPFIND", url, &auth, &[("Depth", "0")], None)
            .await;

        if check_res.success || check_res.status == Some(207) {
            return WebDavResponse {
                success: true,
                status: check_res.status,
                data: None,
                error: None,
                last_modified: None,
                not_found: None,
            };
        }

        let mkcol_res = self.request("MKCOL", url, &auth, &[], None).await;

        WebDavResponse {
            success: mkcol_res.success || mkcol_res.status == Some(201),
            status: mkcol_res.status,
            data: None,
            error: if mkcol_res.success || mkcol_res.status == Some(201) {
                None
            } else {
                mkcol_res.error
            },
            last_modified: None,
            not_found: None,
        }
    }

    pub async fn upload(
        &self,
        file_url: &str,
        config: &WebDavConfig,
        data: &str,
    ) -> WebDavResponse {
        let auth = Self::build_auth(config);
        let content_length = data.len().to_string();

        let response = self
            .request(
                "PUT",
                file_url,
                &auth,
                &[
                    ("Content-Type", "application/json"),
                    ("Content-Length", &content_length),
                ],
                Some(data),
            )
            .await;

        if response.success || response.status == Some(201) || response.status == Some(204) {
            WebDavResponse {
                success: true,
                status: response.status,
                data: None,
                error: None,
                last_modified: None,
                not_found: None,
            }
        } else {
            WebDavResponse {
                success: false,
                status: response.status,
                data: None,
                error: Some(format!(
                    "{} {}",
                    response.status.unwrap_or(0),
                    response.error.unwrap_or_default()
                )),
                last_modified: None,
                not_found: None,
            }
        }
    }

    pub async fn stat(&self, file_url: &str, config: &WebDavConfig) -> WebDavResponse {
        let auth = Self::build_auth(config);

        let response = self
            .request("PROPFIND", file_url, &auth, &[("Depth", "0")], None)
            .await;

        if response.status == Some(404) {
            return WebDavResponse {
                success: false,
                status: response.status,
                data: None,
                error: None,
                last_modified: None,
                not_found: Some(true),
            };
        }

        if response.success || response.status == Some(207) {
            let last_modified = response.data.as_ref().and_then(|data| {
                let re = regex::Regex::new(
                    r"<(?:[a-zA-Z]+:)?getlastmodified>([^<]+)</(?:[a-zA-Z]+:)?getlastmodified>",
                )
                .ok()?;
                re.captures(data)
                    .and_then(|caps| caps.get(1).map(|m| m.as_str().to_string()))
            });

            WebDavResponse {
                success: true,
                status: response.status,
                data: None,
                error: None,
                last_modified,
                not_found: None,
            }
        } else {
            WebDavResponse {
                success: false,
                status: response.status,
                data: None,
                error: Some(format!(
                    "{} {}",
                    response.status.unwrap_or(0),
                    response.error.unwrap_or_default()
                )),
                last_modified: None,
                not_found: None,
            }
        }
    }

    pub async fn download(&self, file_url: &str, config: &WebDavConfig) -> WebDavResponse {
        let auth = Self::build_auth(config);

        let response = self.request("GET", file_url, &auth, &[], None).await;

        if response.status == Some(404) {
            return WebDavResponse {
                success: false,
                status: response.status,
                data: None,
                error: None,
                last_modified: None,
                not_found: Some(true),
            };
        }

        if response.success {
            WebDavResponse {
                success: true,
                status: response.status,
                data: response.data,
                error: None,
                last_modified: None,
                not_found: None,
            }
        } else {
            WebDavResponse {
                success: false,
                status: response.status,
                data: None,
                error: Some(format!(
                    "{} {}",
                    response.status.unwrap_or(0),
                    response.error.unwrap_or_default()
                )),
                last_modified: None,
                not_found: None,
            }
        }
    }

    pub async fn delete(&self, file_url: &str, config: &WebDavConfig) -> WebDavResponse {
        let auth = Self::build_auth(config);

        let response = self.request("DELETE", file_url, &auth, &[], None).await;

        if response.success || response.status == Some(204) {
            WebDavResponse {
                success: true,
                status: response.status,
                data: None,
                error: None,
                last_modified: None,
                not_found: None,
            }
        } else {
            WebDavResponse {
                success: false,
                status: response.status,
                data: None,
                error: Some(format!(
                    "{} {}",
                    response.status.unwrap_or(0),
                    response.error.unwrap_or_default()
                )),
                last_modified: None,
                not_found: None,
            }
        }
    }
}
