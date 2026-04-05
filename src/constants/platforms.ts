export interface SkillPlatform {
  id: string;
  name: string;
  icon: string;
  skillsDir: {
    darwin: string;
    win32: string;
    linux: string;
  };
}

export const SKILL_PLATFORMS: SkillPlatform[] = [
  {
    id: "claude",
    name: "Claude Code",
    icon: "Sparkles",
    skillsDir: {
      darwin: "~/.claude/skills",
      win32: "%USERPROFILE%\\.claude\\skills",
      linux: "~/.claude/skills",
    },
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    icon: "Github",
    skillsDir: {
      darwin: "~/.copilot/skills",
      win32: "%USERPROFILE%\\.copilot\\skills",
      linux: "~/.copilot/skills",
    },
  },
  {
    id: "cursor",
    name: "Cursor",
    icon: "Terminal",
    skillsDir: {
      darwin: "~/.cursor/skills",
      win32: "%USERPROFILE%\\.cursor\\skills",
      linux: "~/.cursor/skills",
    },
  },
  {
    id: "windsurf",
    name: "Windsurf",
    icon: "Wind",
    skillsDir: {
      darwin: "~/.codeium/windsurf/skills",
      win32: "%USERPROFILE%\\.codeium\\windsurf\\skills",
      linux: "~/.codeium/windsurf/skills",
    },
  },
  {
    id: "kiro",
    name: "Kiro",
    icon: "Sparkle",
    skillsDir: {
      darwin: "~/.kiro/skills",
      win32: "%USERPROFILE%\\.kiro\\skills",
      linux: "~/.kiro/skills",
    },
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    icon: "Sparkles",
    skillsDir: {
      darwin: "~/.gemini/skills",
      win32: "%USERPROFILE%\\.gemini\\skills",
      linux: "~/.gemini/skills",
    },
  },
  {
    id: "trae",
    name: "Trae",
    icon: "Zap",
    skillsDir: {
      darwin: "~/.trae/skills",
      win32: "%USERPROFILE%\\.trae\\skills",
      linux: "~/.trae/skills",
    },
  },
  {
    id: "opencode",
    name: "OpenCode",
    icon: "Terminal",
    skillsDir: {
      darwin: "~/.config/opencode/skills",
      win32: "%APPDATA%\\opencode\\skills",
      linux: "~/.config/opencode/skills",
    },
  },
  {
    id: "codex",
    name: "Codex CLI",
    icon: "Terminal",
    skillsDir: {
      darwin: "~/.codex/skills",
      win32: "%USERPROFILE%\\.codex\\skills",
      linux: "~/.codex/skills",
    },
  },
  {
    id: "roo",
    name: "Roo Code",
    icon: "Bot",
    skillsDir: {
      darwin: "~/.roo/skills",
      win32: "%USERPROFILE%\\.roo\\skills",
      linux: "~/.roo/skills",
    },
  },
  {
    id: "amp",
    name: "Amp",
    icon: "Zap",
    skillsDir: {
      darwin: "~/.config/agents/skills",
      win32: "%APPDATA%\\agents\\skills",
      linux: "~/.config/agents/skills",
    },
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    icon: "Bot",
    skillsDir: {
      darwin: "~/.openclaw/skills",
      win32: "%USERPROFILE%\\.openclaw\\skills",
      linux: "~/.openclaw/skills",
    },
  },
  {
    id: "qoder",
    name: "Qoder",
    icon: "Bot",
    skillsDir: {
      darwin: "~/.qoder/skills",
      win32: "%USERPROFILE%\\.qoder\\skills",
      linux: "~/.qoder/skills",
    },
  },
  {
    id: "qoderwork",
    name: "QoderWorker",
    icon: "Code",
    skillsDir: {
      darwin: "~/.qoderwork/skills",
      win32: "%USERPROFILE%\\.qoderwork\\skills",
      linux: "~/.qoderwork/skills",
    },
  },
  {
    id: "codebuddy",
    name: "CodeBuddy",
    icon: "Code",
    skillsDir: {
      darwin: "~/.codebuddy/skills",
      win32: "%USERPROFILE%\\.codebuddy\\skills",
      linux: "~/.codebuddy/skills",
    },
  },
];

export function getPlatformById(id: string): SkillPlatform | undefined {
  return SKILL_PLATFORMS.find((p) => p.id === id);
}
