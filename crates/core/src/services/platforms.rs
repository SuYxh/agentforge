use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillPlatform {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub skills_dir_darwin: String,
    pub skills_dir_win32: String,
    pub skills_dir_linux: String,
}

pub fn get_all_platforms() -> Vec<SkillPlatform> {
    vec![
        SkillPlatform {
            id: "claude".to_string(),
            name: "Claude Code".to_string(),
            icon: "Sparkles".to_string(),
            skills_dir_darwin: "~/.claude/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.claude\\skills".to_string(),
            skills_dir_linux: "~/.claude/skills".to_string(),
        },
        SkillPlatform {
            id: "copilot".to_string(),
            name: "GitHub Copilot".to_string(),
            icon: "Github".to_string(),
            skills_dir_darwin: "~/.copilot/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.copilot\\skills".to_string(),
            skills_dir_linux: "~/.copilot/skills".to_string(),
        },
        SkillPlatform {
            id: "cursor".to_string(),
            name: "Cursor".to_string(),
            icon: "Terminal".to_string(),
            skills_dir_darwin: "~/.cursor/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.cursor\\skills".to_string(),
            skills_dir_linux: "~/.cursor/skills".to_string(),
        },
        SkillPlatform {
            id: "windsurf".to_string(),
            name: "Windsurf".to_string(),
            icon: "Wind".to_string(),
            skills_dir_darwin: "~/.codeium/windsurf/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.codeium\\windsurf\\skills".to_string(),
            skills_dir_linux: "~/.codeium/windsurf/skills".to_string(),
        },
        SkillPlatform {
            id: "kiro".to_string(),
            name: "Kiro".to_string(),
            icon: "Sparkle".to_string(),
            skills_dir_darwin: "~/.kiro/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.kiro\\skills".to_string(),
            skills_dir_linux: "~/.kiro/skills".to_string(),
        },
        SkillPlatform {
            id: "gemini".to_string(),
            name: "Gemini CLI".to_string(),
            icon: "Sparkles".to_string(),
            skills_dir_darwin: "~/.gemini/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.gemini\\skills".to_string(),
            skills_dir_linux: "~/.gemini/skills".to_string(),
        },
        SkillPlatform {
            id: "trae".to_string(),
            name: "Trae".to_string(),
            icon: "Zap".to_string(),
            skills_dir_darwin: "~/.trae/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.trae\\skills".to_string(),
            skills_dir_linux: "~/.trae/skills".to_string(),
        },
        SkillPlatform {
            id: "opencode".to_string(),
            name: "OpenCode".to_string(),
            icon: "Terminal".to_string(),
            skills_dir_darwin: "~/.config/opencode/skills".to_string(),
            skills_dir_win32: "%APPDATA%\\opencode\\skills".to_string(),
            skills_dir_linux: "~/.config/opencode/skills".to_string(),
        },
        SkillPlatform {
            id: "codex".to_string(),
            name: "Codex CLI".to_string(),
            icon: "Terminal".to_string(),
            skills_dir_darwin: "~/.codex/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.codex\\skills".to_string(),
            skills_dir_linux: "~/.codex/skills".to_string(),
        },
        SkillPlatform {
            id: "roo".to_string(),
            name: "Roo Code".to_string(),
            icon: "Bot".to_string(),
            skills_dir_darwin: "~/.roo/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.roo\\skills".to_string(),
            skills_dir_linux: "~/.roo/skills".to_string(),
        },
        SkillPlatform {
            id: "amp".to_string(),
            name: "Amp".to_string(),
            icon: "Zap".to_string(),
            skills_dir_darwin: "~/.config/agents/skills".to_string(),
            skills_dir_win32: "%APPDATA%\\agents\\skills".to_string(),
            skills_dir_linux: "~/.config/agents/skills".to_string(),
        },
        SkillPlatform {
            id: "openclaw".to_string(),
            name: "OpenClaw".to_string(),
            icon: "Bot".to_string(),
            skills_dir_darwin: "~/.openclaw/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.openclaw\\skills".to_string(),
            skills_dir_linux: "~/.openclaw/skills".to_string(),
        },
        SkillPlatform {
            id: "qoder".to_string(),
            name: "Qoder".to_string(),
            icon: "Bot".to_string(),
            skills_dir_darwin: "~/.qoder/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.qoder\\skills".to_string(),
            skills_dir_linux: "~/.qoder/skills".to_string(),
        },
        SkillPlatform {
            id: "qoderwork".to_string(),
            name: "QoderWorker".to_string(),
            icon: "Code".to_string(),
            skills_dir_darwin: "~/.qoderwork/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.qoderwork\\skills".to_string(),
            skills_dir_linux: "~/.qoderwork/skills".to_string(),
        },
        SkillPlatform {
            id: "codebuddy".to_string(),
            name: "CodeBuddy".to_string(),
            icon: "Code".to_string(),
            skills_dir_darwin: "~/.codebuddy/skills".to_string(),
            skills_dir_win32: "%USERPROFILE%\\.codebuddy\\skills".to_string(),
            skills_dir_linux: "~/.codebuddy/skills".to_string(),
        },
    ]
}

pub fn get_platform_by_id(id: &str) -> Option<SkillPlatform> {
    get_all_platforms().into_iter().find(|p| p.id == id)
}

fn resolve_tilde(path: &str) -> String {
    if path.starts_with("~/") || path == "~" {
        if let Some(home) = dirs::home_dir() {
            return path.replacen('~', &home.to_string_lossy(), 1);
        }
    }
    path.to_string()
}

pub fn resolve_platform_path(platform: &SkillPlatform) -> String {
    #[cfg(target_os = "macos")]
    let raw_path = &platform.skills_dir_darwin;

    #[cfg(target_os = "windows")]
    let raw_path = &platform.skills_dir_win32;

    #[cfg(target_os = "linux")]
    let raw_path = &platform.skills_dir_linux;

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    let raw_path = &platform.skills_dir_linux;

    resolve_tilde(raw_path)
}

pub fn detect_installed_platforms() -> Vec<SkillPlatform> {
    get_all_platforms()
        .into_iter()
        .filter(|p| {
            let skills_dir = resolve_platform_path(p);
            let platform_root = Path::new(&skills_dir)
                .parent()
                .unwrap_or(Path::new(&skills_dir));
            platform_root.exists()
        })
        .collect()
}
