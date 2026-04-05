use crate::error::AppError;
use rusqlite::Connection;

const SCHEMA_TABLES: &str = "
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prompt_type TEXT DEFAULT 'text',
  system_prompt TEXT,
  user_prompt TEXT NOT NULL,
  variables TEXT,
  tags TEXT,
  folder_id TEXT,
  images TEXT,
  is_favorite INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  current_version INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  source TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  system_prompt TEXT,
  user_prompt TEXT NOT NULL,
  variables TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
  UNIQUE(prompt_id, version)
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  parent_id TEXT,
  sort_order INTEGER DEFAULT 0,
  is_private INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT,
  mcp_config TEXT,
  protocol_type TEXT DEFAULT 'mcp',
  version TEXT,
  author TEXT,
  tags TEXT,
  original_tags TEXT,
  is_favorite INTEGER DEFAULT 0,
  source_url TEXT,
  local_repo_path TEXT,
  icon_url TEXT,
  icon_emoji TEXT,
  icon_background TEXT,
  category TEXT DEFAULT 'general',
  is_builtin INTEGER DEFAULT 0,
  registry_slug TEXT,
  content_url TEXT,
  prerequisites TEXT,
  compatibility TEXT,
  current_version INTEGER DEFAULT 0,
  version_tracking_enabled INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS skill_versions (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  content TEXT,
  files_snapshot TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(skill_id, version)
);
";

const SCHEMA_INDEXES: &str = "
CREATE INDEX IF NOT EXISTS idx_prompts_folder ON prompts(folder_id);
CREATE INDEX IF NOT EXISTS idx_prompts_updated ON prompts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_favorite ON prompts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_skills_updated ON skills(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_skills_favorite ON skills(is_favorite);
CREATE INDEX IF NOT EXISTS idx_skill_versions_skill ON skill_versions(skill_id);

CREATE INDEX IF NOT EXISTS idx_prompts_pinned ON prompts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_prompts_created ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_usage ON prompts(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_folders_sort ON folders(sort_order);

CREATE INDEX IF NOT EXISTS idx_prompts_folder_favorite ON prompts(folder_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_prompts_folder_updated ON prompts(folder_id, updated_at DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS prompts_fts USING fts5(
  title, description, system_prompt, user_prompt, tags,
  content='prompts', content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS prompts_ai AFTER INSERT ON prompts BEGIN
  INSERT INTO prompts_fts(rowid, title, description, system_prompt, user_prompt, tags)
  VALUES (NEW.rowid, NEW.title, NEW.description, NEW.system_prompt, NEW.user_prompt, NEW.tags);
END;

CREATE TRIGGER IF NOT EXISTS prompts_ad AFTER DELETE ON prompts BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, description, system_prompt, user_prompt, tags)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.description, OLD.system_prompt, OLD.user_prompt, OLD.tags);
END;

CREATE TRIGGER IF NOT EXISTS prompts_au AFTER UPDATE ON prompts BEGIN
  INSERT INTO prompts_fts(prompts_fts, rowid, title, description, system_prompt, user_prompt, tags)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.description, OLD.system_prompt, OLD.user_prompt, OLD.tags);
  INSERT INTO prompts_fts(rowid, title, description, system_prompt, user_prompt, tags)
  VALUES (NEW.rowid, NEW.title, NEW.description, NEW.system_prompt, NEW.user_prompt, NEW.tags);
END;
";

pub fn migrate(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(SCHEMA_TABLES)?;
    conn.execute_batch(SCHEMA_INDEXES)?;
    Ok(())
}
