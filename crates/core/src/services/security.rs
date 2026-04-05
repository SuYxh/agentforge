use aes_gcm::aead::{Aead, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use rand::RngCore;
use rusqlite::Connection;
use scrypt::scrypt;
use serde::{Deserialize, Serialize};
use subtle::ConstantTimeEq;

use crate::database::settings::SettingsDB;
use crate::error::AppError;

const SETTINGS_KEY: &str = "master_password";

#[derive(Debug, Serialize, Deserialize)]
struct StoredMasterPassword {
    salt: String,
    hash: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecurityStatus {
    pub configured: bool,
    pub unlocked: bool,
}

pub struct SecurityService {
    key: Option<Vec<u8>>,
    unlocked: bool,
}

impl SecurityService {
    pub fn new() -> Self {
        Self {
            key: None,
            unlocked: false,
        }
    }

    pub fn status(&self, conn: &Connection) -> SecurityStatus {
        let configured = SettingsDB::get(conn, SETTINGS_KEY)
            .ok()
            .flatten()
            .and_then(|v| serde_json::from_str::<StoredMasterPassword>(&v).ok())
            .is_some();
        SecurityStatus {
            configured,
            unlocked: self.unlocked,
        }
    }

    pub fn set_master_password(
        &mut self,
        conn: &Connection,
        password: &str,
    ) -> Result<(), AppError> {
        let mut salt = [0u8; 16];
        OsRng.fill_bytes(&mut salt);

        let derived = derive_key(password, &salt)?;

        let stored = StoredMasterPassword {
            salt: BASE64.encode(salt),
            hash: BASE64.encode(&derived),
        };
        let json = serde_json::to_string(&stored)?;
        SettingsDB::set(conn, SETTINGS_KEY, &json)?;

        self.key = Some(derived);
        self.unlocked = true;
        Ok(())
    }

    pub fn unlock(&mut self, conn: &Connection, password: &str) -> Result<bool, AppError> {
        let stored_json = match SettingsDB::get(conn, SETTINGS_KEY)? {
            Some(v) => v,
            None => return Ok(false),
        };
        let stored: StoredMasterPassword = serde_json::from_str(&stored_json)?;

        let salt = BASE64
            .decode(&stored.salt)
            .map_err(|e| AppError::Other(e.to_string()))?;
        let stored_hash = BASE64
            .decode(&stored.hash)
            .map_err(|e| AppError::Other(e.to_string()))?;

        let derived = derive_key(password, &salt)?;

        let ok = derived.ct_eq(&stored_hash).into();
        if ok {
            self.key = Some(derived);
            self.unlocked = true;
        }
        Ok(ok)
    }

    pub fn lock(&mut self) {
        self.key = None;
        self.unlocked = false;
    }

    pub fn encrypt_text(&self, plain: &str) -> Result<String, AppError> {
        let key = self
            .key
            .as_ref()
            .ok_or_else(|| AppError::Other("Security service is locked".into()))?;

        let cipher =
            Aes256Gcm::new_from_slice(key).map_err(|e| AppError::Other(e.to_string()))?;

        let mut iv = [0u8; 12];
        OsRng.fill_bytes(&mut iv);
        let nonce = Nonce::from_slice(&iv);

        let ciphertext = cipher
            .encrypt(nonce, plain.as_bytes())
            .map_err(|e| AppError::Other(e.to_string()))?;

        let tag = &ciphertext[ciphertext.len() - 16..];
        let enc = &ciphertext[..ciphertext.len() - 16];

        let mut payload = Vec::with_capacity(12 + 16 + enc.len());
        payload.extend_from_slice(&iv);
        payload.extend_from_slice(tag);
        payload.extend_from_slice(enc);

        Ok(format!("ENC::{}", BASE64.encode(payload)))
    }

    pub fn decrypt_text(&self, data: &str) -> Result<String, AppError> {
        if !data.starts_with("ENC::") {
            return Ok(data.to_string());
        }

        let key = self
            .key
            .as_ref()
            .ok_or_else(|| AppError::Other("Security service is locked".into()))?;

        let cipher =
            Aes256Gcm::new_from_slice(key).map_err(|e| AppError::Other(e.to_string()))?;

        let payload = BASE64
            .decode(&data[5..])
            .map_err(|e| AppError::Other(e.to_string()))?;

        if payload.len() < 28 {
            return Err(AppError::Other("Invalid encrypted data".into()));
        }

        let iv = &payload[..12];
        let tag = &payload[12..28];
        let enc = &payload[28..];

        let nonce = Nonce::from_slice(iv);

        let mut ciphertext_with_tag = Vec::with_capacity(enc.len() + 16);
        ciphertext_with_tag.extend_from_slice(enc);
        ciphertext_with_tag.extend_from_slice(tag);

        let plaintext = cipher
            .decrypt(nonce, ciphertext_with_tag.as_ref())
            .map_err(|e| AppError::Other(e.to_string()))?;

        String::from_utf8(plaintext).map_err(|e| AppError::Other(e.to_string()))
    }

    pub fn get_key(&self) -> Option<&[u8]> {
        self.key.as_deref()
    }
}

fn derive_key(password: &str, salt: &[u8]) -> Result<Vec<u8>, AppError> {
    let params = scrypt::Params::new(14, 8, 1, 32).map_err(|e| AppError::Other(e.to_string()))?;
    let mut key = vec![0u8; 32];
    scrypt(password.as_bytes(), salt, &params, &mut key)
        .map_err(|e| AppError::Other(e.to_string()))?;
    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA journal_mode=WAL;").unwrap();
        conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
        crate::database::schema::migrate(&conn).unwrap();
        conn
    }

    #[test]
    fn test_set_master_password_and_status() {
        let conn = setup_test_db();
        let mut svc = SecurityService::new();
        let status = svc.status(&conn);
        assert!(!status.configured);
        assert!(!status.unlocked);

        svc.set_master_password(&conn, "secret123").unwrap();
        let status = svc.status(&conn);
        assert!(status.configured);
        assert!(status.unlocked);
    }

    #[test]
    fn test_unlock_with_correct_password() {
        let conn = setup_test_db();
        let mut svc = SecurityService::new();
        svc.set_master_password(&conn, "correct").unwrap();
        svc.lock();
        assert!(!svc.status(&conn).unlocked);

        let ok = svc.unlock(&conn, "correct").unwrap();
        assert!(ok);
        assert!(svc.status(&conn).unlocked);
    }

    #[test]
    fn test_unlock_with_wrong_password() {
        let conn = setup_test_db();
        let mut svc = SecurityService::new();
        svc.set_master_password(&conn, "correct").unwrap();
        svc.lock();

        let ok = svc.unlock(&conn, "wrong").unwrap();
        assert!(!ok);
        assert!(!svc.status(&conn).unlocked);
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let conn = setup_test_db();
        let mut svc = SecurityService::new();
        svc.set_master_password(&conn, "pass").unwrap();

        let plain = "Hello, World!";
        let encrypted = svc.encrypt_text(plain).unwrap();
        assert!(encrypted.starts_with("ENC::"));
        let decrypted = svc.decrypt_text(&encrypted).unwrap();
        assert_eq!(decrypted, plain);
    }

    #[test]
    fn test_decrypt_non_encrypted_text() {
        let conn = setup_test_db();
        let mut svc = SecurityService::new();
        svc.set_master_password(&conn, "pass").unwrap();

        let plain = "not encrypted";
        let result = svc.decrypt_text(plain).unwrap();
        assert_eq!(result, plain);
    }

    #[test]
    fn test_lock_clears_key() {
        let conn = setup_test_db();
        let mut svc = SecurityService::new();
        svc.set_master_password(&conn, "pass").unwrap();
        assert!(svc.get_key().is_some());

        svc.lock();
        assert!(svc.get_key().is_none());
        assert!(!svc.status(&conn).unlocked);
    }
}
