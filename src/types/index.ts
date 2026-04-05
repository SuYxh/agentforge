export type PromptType = "text" | "image" | "video";

export interface Prompt {
  id: string;
  title: string;
  description?: string;
  promptType?: PromptType;
  systemPrompt?: string;
  systemPromptEn?: string;
  userPrompt: string;
  userPromptEn?: string;
  variables: Variable[];
  tags: string[];
  folderId?: string;
  images?: string[];
  videos?: string[];
  isFavorite: boolean;
  isPinned: boolean;
  version: number;
  currentVersion: number;
  usageCount: number;
  source?: string;
  notes?: string;
  lastAiResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Variable {
  name: string;
  type: VariableType;
  label?: string;
  defaultValue?: string;
  options?: string[];
  required: boolean;
}

export type VariableType = "text" | "textarea" | "number" | "select";

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  systemPrompt?: string;
  userPrompt: string;
  variables: Variable[];
  note?: string;
  aiResponse?: string;
  createdAt: string;
}

export interface CreatePromptDTO {
  title: string;
  description?: string;
  promptType?: PromptType;
  systemPrompt?: string;
  systemPromptEn?: string;
  userPrompt: string;
  userPromptEn?: string;
  variables?: Variable[];
  tags?: string[];
  folderId?: string;
  images?: string[];
  videos?: string[];
  source?: string;
  notes?: string;
}

export interface UpdatePromptDTO {
  title?: string;
  description?: string;
  promptType?: PromptType;
  systemPrompt?: string;
  systemPromptEn?: string;
  userPrompt?: string;
  userPromptEn?: string;
  variables?: Variable[];
  tags?: string[];
  folderId?: string;
  images?: string[];
  videos?: string[];
  isFavorite?: boolean;
  isPinned?: boolean;
  usageCount?: number;
  source?: string;
  notes?: string;
  lastAiResponse?: string;
}

export interface SearchQuery {
  keyword?: string;
  tags?: string[];
  folderId?: string;
  isFavorite?: boolean;
  sortBy?: "title" | "createdAt" | "updatedAt" | "usageCount";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  parentId?: string;
  order: number;
  isPrivate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderDTO {
  name: string;
  icon?: string;
  parentId?: string;
  isPrivate?: boolean;
}

export interface UpdateFolderDTO {
  name?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isPrivate?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  content?: string;
  mcp_config?: string;
  protocol_type: "skill" | "mcp" | "claude-code";
  version?: string;
  author?: string;
  source_url?: string;
  local_repo_path?: string;
  tags?: string[];
  original_tags?: string[];
  is_favorite: boolean;
  currentVersion?: number;
  versionTrackingEnabled?: boolean;
  created_at: number;
  updated_at: number;
  icon_url?: string;
  icon_emoji?: string;
  icon_background?: string;
  category?: SkillCategory;
  is_builtin?: boolean;
  registry_slug?: string;
  content_url?: string;
  prerequisites?: string[];
  compatibility?: string[];
}

export type SkillCategory =
  | "general"
  | "office"
  | "dev"
  | "ai"
  | "data"
  | "management"
  | "deploy"
  | "design"
  | "security"
  | "meta";

export type CreateSkillParams = Omit<Skill, "id" | "created_at" | "updated_at">;
export type UpdateSkillParams = Partial<
  Omit<Skill, "id" | "created_at" | "updated_at">
>;

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface SkillMCPConfig {
  servers: Record<string, MCPServerConfig>;
}

export interface SkillChatParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  enableThinking?: boolean;
  customParams?: Record<string, string | number | boolean>;
}

export interface SkillManifest {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  tags?: string[];
  instructions?: string;
}

export interface GitHubRepoOwner {
  login?: string;
}

export interface GitHubRepoMetadata {
  default_branch?: string;
  owner?: GitHubRepoOwner;
}

export interface GitHubTreeEntry {
  path?: string;
  type?: string;
}

export interface GitHubTreeResponse {
  tree?: GitHubTreeEntry[];
}

export interface MarketplaceReferenceEntry {
  url?: string;
  index?: string;
  manifest?: string;
}

export interface MarketplaceSkillEntry {
  slug?: string;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  category?: SkillCategory;
  icon_url?: string;
  icon_background?: string;
  iconUrl?: string;
  icon_emoji?: string;
  iconEmoji?: string;
  author?: string;
  source_url?: string;
  sourceUrl?: string;
  repo_url?: string;
  repoUrl?: string;
  repository?: string;
  repo?: string;
  content_url?: string;
  contentUrl?: string;
  skill_url?: string;
  skillUrl?: string;
  raw_url?: string;
  rawUrl?: string;
  content?: string;
  tags?: string[];
  version?: string | number;
  prerequisites?: string[];
  compatibility?: string[];
}

export interface MarketplaceRegistryDocument {
  skills?: MarketplaceSkillEntry[];
  marketplaces?: Array<string | MarketplaceReferenceEntry>;
  sources?: Array<string | MarketplaceReferenceEntry>;
  registries?: Array<string | MarketplaceReferenceEntry>;
}

export interface RegistrySkill {
  slug: string;
  name: string;
  description: string;
  category: SkillCategory;
  icon_url?: string;
  icon_background?: string;
  icon_emoji?: string;
  author: string;
  source_url: string;
  tags: string[];
  version: string;
  content: string;
  content_url?: string;
  prerequisites?: string[];
  compatibility?: string[];
}

export interface SkillStoreSource {
  id: string;
  name: string;
  type: "official" | "community" | "marketplace-json" | "git-repo" | "local-dir";
  url: string;
  enabled: boolean;
  order?: number;
  createdAt: number;
}

export interface SkillRegistry {
  version: string;
  updated_at: string;
  skills: RegistrySkill[];
}

export interface SkillVersion {
  id: string;
  skillId: string;
  version: number;
  content?: string;
  filesSnapshot?: SkillFileSnapshot[];
  note?: string;
  createdAt: string;
}

export interface SkillFileSnapshot {
  relativePath: string;
  content: string;
}

export interface SkillLocalFileEntry {
  path: string;
  content: string;
  isDirectory: boolean;
}

export interface SkillLocalFileTreeEntry {
  path: string;
  isDirectory: boolean;
  size?: number;
}

export interface ScannedSkill {
  name: string;
  description: string;
  version?: string;
  author: string;
  tags: string[];
  instructions: string;
  filePath: string;
  localPath: string;
  platforms: string[];
}

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

export interface Settings {
  theme: Theme;
  language: Language;
  autoSave: boolean;
  defaultFolderId?: string;
  customSkillPlatformPaths?: Record<string, string>;
  security?: {
    masterPasswordConfigured: boolean;
    unlocked: boolean;
  };
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'zh';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'zh',
  autoSave: true,
  customSkillPlatformPaths: {},
};
