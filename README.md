<div align="center">

# ⚒️ AgentForge

**AI Agent Toolkit — Prompts, Skills & Code**

一款简洁高效的 AI Prompt 与 Skill 管理工具，使用 Tauri 2 + Rust 构建。
所有数据存储在本地，隐私安全有保障。

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Tauri 2](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.75+-DEA584?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[English](./README.en.md) · **简体中文** · [下载安装](#-安装) · [功能一览](#-功能特性) · [技术架构](#️-技术架构) · [参与贡献](#-参与贡献)

<!-- 
  TODO: 添加项目截图
  <img src="docs/imgs/screenshot.png" width="800" alt="AgentForge Screenshot" />
-->

</div>

---

## ✨ 功能特性

### 📝 Prompt 管理

- **多视图浏览** — 支持卡片视图、列表视图、表格视图自由切换
- **智能标签系统** — 自定义标签分类，标签云快速筛选
- **变量模板** — 支持 `{{variable}}` 模板语法，内置变量输入面板
- **版本控制** — 每次编辑自动保存历史版本，支持版本对比与回滚
- **双语对照** — 支持中英文并排显示，方便跨语言使用
- **AI 测试** — 内置 AI 对话测试面板，支持文本 / 图像 / 视频多模态
- **收藏 & 置顶** — 快速收藏常用 Prompt，置顶重要内容
- **使用统计** — 自动记录每条 Prompt 的使用次数，识别高频内容
- **富文本预览** — 支持 Markdown 渲染、语法高亮、GFM 扩展

### 🧩 Skill 管理与分发

- **Skill 编辑器** — 内置代码编辑器，支持 SKILL.md 和多文件编辑
- **本地仓库** — 每个 Skill 独立文件仓库，支持完整项目结构
- **版本追踪** — Skill 文件级版本快照，支持差异对比
- **一键安装到 15+ AI 平台** — 支持分发到：

  | 平台 | 平台 | 平台 |
  |------|------|------|
  | Claude Code | GitHub Copilot | Cursor |
  | Windsurf | Kiro | Gemini CLI |
  | Trae | OpenCode | Codex CLI |
  | Roo Code | Amp | OpenClaw |
  | Qoder | QoderWorker | CodeBuddy |

- **批量部署** — 一次选择多个平台，批量安装 / 卸载
- **Skill 商店** — 内置技能商店 + 自定义第三方源（marketplace.json / Git 仓库）
- **本地扫描导入** — 自动检测本地 AI 工具目录中的 SKILL.md 文件

### 📂 文件夹与组织

- **无限层级文件夹** — 支持嵌套子文件夹，灵活组织内容
- **拖拽排序** — 基于 dnd-kit 的流畅拖拽体验
- **私密文件夹** — 支持密码加锁的私密文件夹，保护敏感内容
- **快速移动** — 批量选择 Prompt，一键移动到指定文件夹

### 🔒 安全与加密

- **本地优先** — 所有数据存储在本地 SQLite 数据库，不上传任何服务器
- **主密码** — 设置主密码保护私密文件夹和敏感数据
- **军事级加密** — 使用 scrypt 密钥派生 + AES-256-GCM 对称加密
- **Tauri 安全模型** — 基于 Capabilities 的权限系统，最小化暴露面

### ☁️ 数据同步与备份

- **WebDAV 同步** — 支持 WebDAV 协议云端同步（坚果云、NextCloud 等）
- **完整备份** — 一键导出 / 导入全部数据（JSON 格式）
- **数据库清理** — 支持清空数据库重新开始

### 🎨 界面与体验

- **Liquid Glass 设计** — 采用 Apple WWDC25 发布的液态玻璃设计语言
- **深色 / 浅色主题** — 跟随系统或手动切换，深色模式优化
- **多语言支持** — 内置简体中文、英文，另有繁体中文、日文、德文、西班牙文、法文
- **全局快捷键** — 支持全局 / 局部快捷键，快速唤起搜索
- **流畅动效** — 基于 framer-motion 的液态弹性动画
- **响应式布局** — 自适应不同窗口大小

### 🖥️ CLI 工具

- **原生 Rust CLI** — 独立的命令行工具 `agentforge-cli`
- **支持四大模块** — prompt / skill / folder / setting 全覆盖
- **多输出格式** — 支持 `--output table`（彩色表格）和 `--output json`
- **与桌面端共享数据** — 直接读写同一个 SQLite 数据库

---

## 📦 安装

### 从 Release 下载

前往 [GitHub Releases](https://github.com/SuYxh/agentforge/releases) 下载对应平台的安装包：

| 平台 | 格式 | 备注 |
|------|------|------|
| **macOS** | `.dmg` | 支持 Intel 和 Apple Silicon |
| **Windows** | `.msi` / `.exe` | 支持 NSIS 和 WiX 安装器 |
| **Linux** | `.deb` / `.AppImage` | 需要 libwebkit2gtk |

### 从源码构建

**环境要求：**
- [Rust](https://rustup.rs/) 1.75+
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 8+
- [Tauri 2 CLI](https://v2.tauri.app/start/prerequisites/)

```bash
# 克隆仓库
git clone https://github.com/SuYxh/agentforge.git
cd agentforge

# 安装前端依赖
pnpm install

# 开发模式
pnpm dev

# 构建发布版
pnpm build
```

### CLI 工具

```bash
# 构建 CLI
cd src-cli
cargo build --release

# 使用示例
agentforge-cli prompt list
agentforge-cli skill list --output json
agentforge-cli folder create --name "My Folder"
```

---

## 🏗️ 技术架构

```
agentforge/
├── src/                    # 前端 (React 19 + TypeScript + Tailwind CSS)
│   ├── components/         # UI 组件
│   │   ├── ui/             # 基础 UI 原子组件
│   │   ├── prompt/         # Prompt 管理组件
│   │   ├── skill/          # Skill 管理组件
│   │   ├── settings/       # 设置面板
│   │   ├── folder/         # 文件夹管理
│   │   └── layout/         # 布局框架
│   ├── stores/             # Zustand 状态管理
│   ├── services/           # 服务层 (Tauri API 封装、AI、WebDAV)
│   ├── i18n/               # 国际化 (7 种语言)
│   └── types/              # TypeScript 类型定义
│
├── src-tauri/              # Tauri 2 应用壳 (Rust)
│   └── src/
│       ├── commands/       # 77 个 Tauri Command
│       ├── setup.rs        # 应用初始化
│       └── state.rs        # 全局状态
│
├── crates/core/            # 核心业务逻辑 (Rust)
│   ├── database/           # SQLite 数据库操作 (rusqlite)
│   ├── models/             # 数据模型
│   ├── services/           # 业务服务
│   │   ├── security.rs     # scrypt + AES-256-GCM 加密
│   │   ├── platforms.rs    # 15+ AI 平台分发
│   │   ├── webdav.rs       # WebDAV 同步
│   │   └── skill_validator.rs
│   └── error.rs            # 统一错误处理
│
└── src-cli/                # CLI 工具 (Rust + clap)
    └── src/main.rs         # prompt / skill / folder / setting
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | React 19 + TypeScript 5.8 | 最新 React 版本 |
| **样式方案** | Tailwind CSS 3 + Liquid Glass | Apple WWDC25 设计语言 |
| **状态管理** | Zustand 5 | 轻量响应式状态管理 |
| **动画引擎** | Framer Motion 12 | 液态弹性动效 |
| **桌面框架** | Tauri 2 | Rust 驱动，安全高性能 |
| **数据库** | SQLite (rusqlite) | 原生编译，零开销 |
| **加密** | scrypt + AES-256-GCM | 军事级对称加密 |
| **CLI** | clap + comfy-table | Rust 原生命令行工具 |
| **国际化** | i18next + react-i18next | 7 种语言支持 |
| **图标** | Lucide React | 清晰一致的图标系统 |
| **拖拽** | dnd-kit | 高性能拖拽排序 |
| **Markdown** | react-markdown + rehype | 完整 Markdown 渲染与高亮 |

### 与传统 Electron 方案的对比

| 维度 | Electron 方案 | AgentForge (Tauri 2) |
|------|--------------|----------------------|
| 安装包体积 | ~150MB | **~15MB**（10 倍缩小） |
| 内存占用 | ~300MB | **~80MB**（4 倍降低） |
| 后端语言 | JavaScript (Node.js) | **Rust**（内存安全 + 高性能） |
| SQLite | WASM 解释执行 | **原生编译**（零开销） |
| 加密 | Node.js crypto | **scrypt + AES-256-GCM** |
| 安全模型 | contextIsolation | **Tauri Capabilities** 权限系统 |
| CLI 工具 | Node.js 脚本 | **Rust 原生二进制** |
| 平台分发 | 不支持 | **15+ AI 平台** |

---

## 🔧 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 代码检查
pnpm lint
pnpm typecheck

# 运行测试
pnpm test

# 构建生产版本
pnpm build
```

### 项目代码量

| 模块 | 语言 | 行数 | 文件数 |
|------|------|------|--------|
| **Rust 后端** | Rust | ~5,540 | 35 |
| **前端** | TypeScript + TSX | ~37,000 | 100+ |
| **Tauri Commands** | Rust | 77 个 | 9 |
| **i18n** | JSON | 7 种语言 | 7 |

---

## 🌍 国际化

AgentForge 支持以下语言：

| 语言 | 代码 | 状态 |
|------|------|------|
| 🇨🇳 简体中文 | `zh` | ✅ 完整 |
| 🇺🇸 English | `en` | ✅ 完整 |
| 🇹🇼 繁體中文 | `zh-TW` | 🔄 进行中 |
| 🇯🇵 日本語 | `ja` | 🔄 进行中 |
| 🇩🇪 Deutsch | `de` | 🔄 进行中 |
| 🇪🇸 Español | `es` | 🔄 进行中 |
| 🇫🇷 Français | `fr` | 🔄 进行中 |

欢迎通过 PR 帮助完善翻译！翻译文件位于 `src/i18n/locales/`。

---

## 🤝 参与贡献

欢迎任何形式的贡献！无论是 Bug 报告、功能建议还是 Pull Request。

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

---

## 📄 许可证

本项目基于 [AGPL-3.0](./LICENSE) 许可证开源。

---

## 🙏 致谢

本项目的功能设计灵感来源于 [PromptHub](https://github.com/legeling/PromptHub)（AGPL-3.0），
感谢 [@legeling](https://github.com/legeling) 的开创性工作。

本版本使用 **Tauri 2 + Rust** 从零重构了整个后端架构（5,500+ 行 Rust 代码），
并对前端进行了大幅改造，主要变更包括：

- 后端从 Electron (Node.js) 完整迁移至 Tauri 2 (Rust)
- 数据库从 WASM SQLite 迁移至原生 rusqlite
- 新增 scrypt + AES-256-GCM 加密模块
- 新增 15+ AI 平台 Skill 分发能力
- 新增 Rust CLI 工具（clap 构建）
- UI 升级至 Liquid Glass 设计语言
- 安装包体积从 ~150MB 缩减至 ~15MB

---

<div align="center">

**如果 AgentForge 对你有帮助，请给一个 ⭐ Star！**

Made with ❤️ and 🦀 Rust

</div>
