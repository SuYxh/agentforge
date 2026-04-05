import { invoke } from '@tauri-apps/api/core';
import type { Prompt, PromptVersion, CreatePromptDTO, UpdatePromptDTO, SearchQuery, Folder, CreateFolderDTO, UpdateFolderDTO, Skill, SkillVersion, SkillFileSnapshot, SkillLocalFileEntry, SkillLocalFileTreeEntry, CreateSkillParams, UpdateSkillParams } from '../types';

export const promptApi = {
  create: (dto: CreatePromptDTO) => invoke<Prompt>('prompt_create', { dto }),
  get: (id: string) => invoke<Prompt | null>('prompt_get', { id }),
  getAll: () => invoke<Prompt[]>('prompt_get_all'),
  update: (id: string, dto: UpdatePromptDTO) => invoke<Prompt>('prompt_update', { id, dto }),
  delete: (id: string) => invoke<boolean>('prompt_delete', { id }),
  search: (query: SearchQuery) => invoke<Prompt[]>('prompt_search', { query }),
  copy: (id: string) => invoke<Prompt>('prompt_copy', { id }),
};

export const versionApi = {
  getAll: (promptId: string) => invoke<PromptVersion[]>('version_get_all', { promptId }),
  create: (promptId: string, systemPrompt: string | null, userPrompt: string, note?: string) =>
    invoke<PromptVersion>('version_create', { promptId, systemPrompt, userPrompt, note }),
  rollback: (promptId: string, version: number) => invoke<Prompt>('version_rollback', { promptId, version }),
};

export const folderApi = {
  create: (dto: CreateFolderDTO) => invoke<Folder>('folder_create', { dto }),
  getAll: () => invoke<Folder[]>('folder_get_all'),
  update: (id: string, dto: UpdateFolderDTO) => invoke<Folder>('folder_update', { id, dto }),
  delete: (id: string) => invoke<boolean>('folder_delete', { id }),
  reorder: (updates: { id: string; order: number }[]) => invoke<void>('folder_reorder', { updates }),
};

export const settingsApi = {
  get: (key: string) => invoke<string | null>('settings_get', { key }),
  set: (key: string, value: string) => invoke<void>('settings_set', { key, value }),
};

export const skillApi = {
  create: (data: CreateSkillParams, options?: { skipInitialVersion?: boolean; overwriteExisting?: boolean }) =>
    invoke<Skill>('skill_create', { dto: { ...data, skipInitialVersion: options?.skipInitialVersion, overwriteExisting: options?.overwriteExisting } }),
  get: (id: string) => invoke<Skill | null>('skill_get', { id }),
  getAll: () => invoke<Skill[]>('skill_get_all'),
  update: (id: string, data: UpdateSkillParams) => invoke<Skill>('skill_update', { id, dto: data }),
  delete: (id: string) => invoke<boolean>('skill_delete', { id }),
  deleteAll: () => invoke<void>('skill_delete_all'),
  search: (query: string) => invoke<Skill[]>('skill_search', { query }),
  fetchRemoteContent: (url: string) => invoke<string>('skill_fetch_remote_content', { url }),
  saveToRepo: (skillName: string, sourceDir: string) => invoke<string>('skill_save_to_repo', { skillName, sourceDir }),
  listLocalFiles: (skillId: string) => invoke<SkillLocalFileTreeEntry[]>('skill_list_local_files', { skillId }),
  readLocalFile: (skillId: string, relativePath: string) => invoke<SkillLocalFileEntry | null>('skill_read_local_file', { skillId, relativePath }),
  readLocalFiles: (skillId: string) => invoke<SkillLocalFileEntry[]>('skill_read_local_files', { skillId }),
  writeLocalFile: (skillId: string, relativePath: string, content: string, _options?: { skipVersionSnapshot?: boolean }) =>
    invoke<void>('skill_write_local_file', { skillId, relativePath, content }),
  deleteLocalFile: (skillId: string, relativePath: string) => invoke<boolean>('skill_delete_local_file', { skillId, relativePath }),
  createLocalDir: (skillId: string, relativePath: string) => invoke<void>('skill_create_local_dir', { skillId, relativePath }),
  getRepoPath: (skillId: string) => invoke<string | null>('skill_get_repo_path', { skillId }),
  renameLocalPath: (skillId: string, oldRelativePath: string, newRelativePath: string) =>
    invoke<void>('skill_rename_local_path', { skillId, oldRelativePath, newRelativePath }),
  versionGetAll: (skillId: string) => invoke<SkillVersion[]>('skill_version_get_all', { skillId }),
  versionCreate: (skillId: string, note?: string, filesSnapshot?: SkillFileSnapshot[]) =>
    invoke<SkillVersion>('skill_version_create', { skillId, note, filesSnapshot }),
  versionRollback: (skillId: string, version: number) => invoke<Skill>('skill_version_rollback', { skillId, version }),
  insertVersionDirect: (version: SkillVersion) => invoke<void>('skill_version_insert_direct', { version }),
};

export const backupApi = {
  exportData: () => invoke<any>('backup_export_data'),
  importData: (backup: any) => invoke<void>('backup_import_data', { backup }),
  clearDatabase: () => invoke<void>('backup_clear_database'),
};

export const imageApi = {
  save: (filePaths: string[]) => invoke<string[]>('image_save', { filePaths }),
  saveBuffer: (buffer: number[]) => invoke<string | null>('image_save_buffer', { buffer }),
  download: (url: string) => invoke<string | null>('image_download', { url }),
  list: () => invoke<string[]>('image_list'),
  getSize: (fileName: string) => invoke<number | null>('image_get_size', { fileName }),
  readBase64: (fileName: string) => invoke<string | null>('image_read_base64', { fileName }),
  saveBase64: (fileName: string, base64Data: string) => invoke<boolean>('image_save_base64', { fileName, base64Data }),
  exists: (fileName: string) => invoke<boolean>('image_exists', { fileName }),
  clear: () => invoke<boolean>('image_clear'),
  getPath: (fileName: string) => invoke<string>('image_get_path', { fileName }),
};

export const videoApi = {
  save: (filePaths: string[]) => invoke<string[]>('video_save', { filePaths }),
  list: () => invoke<string[]>('video_list'),
  getSize: (fileName: string) => invoke<number | null>('video_get_size', { fileName }),
  readBase64: (fileName: string) => invoke<string | null>('video_read_base64', { fileName }),
  saveBase64: (fileName: string, base64Data: string) => invoke<boolean>('video_save_base64', { fileName, base64Data }),
  exists: (fileName: string) => invoke<boolean>('video_exists', { fileName }),
  clear: () => invoke<boolean>('video_clear'),
  getPath: (fileName: string) => invoke<string>('video_get_path', { fileName }),
};

export const webdavApi = {
  testConnection: (config: { url: string; username: string; password: string }) =>
    invoke<{ success: boolean; message?: string }>('webdav_test_connection', { config }),
  ensureDirectory: (url: string, config: { url: string; username: string; password: string }) =>
    invoke<{ success: boolean; message?: string }>('webdav_ensure_directory', { url, config }),
  upload: (fileUrl: string, config: { url: string; username: string; password: string }, data: string) =>
    invoke<{ success: boolean; message?: string }>('webdav_upload', { fileUrl, config, data }),
  download: (fileUrl: string, config: { url: string; username: string; password: string }) =>
    invoke<{ success: boolean; data?: string; message?: string }>('webdav_download', { fileUrl, config }),
  stat: (fileUrl: string, config: { url: string; username: string; password: string }) =>
    invoke<{ success: boolean; data?: string; message?: string }>('webdav_stat', { fileUrl, config }),
  delete: (fileUrl: string, config: { url: string; username: string; password: string }) =>
    invoke<{ success: boolean; message?: string }>('webdav_delete', { fileUrl, config }),
};

export const securityApi = {
  status: () => invoke<{ configured: boolean; unlocked: boolean }>('security_status'),
  setMasterPassword: (password: string) => invoke<void>('security_set_master_password', { password }),
  unlock: (password: string) => invoke<boolean>('security_unlock', { password }),
  lock: () => invoke<void>('security_lock'),
  encrypt: (text: string) => invoke<string>('security_encrypt', { text }),
  decrypt: (data: string) => invoke<string>('security_decrypt', { data }),
};

export interface PlatformInfo {
  id: string;
  name: string;
  icon: string;
  skills_dir: string;
  detected: boolean;
}

export interface SkillInstallStatus {
  platform_id: string;
  installed: boolean;
  install_mode: string | null;
}

export const platformApi = {
  getAll: () => invoke<PlatformInfo[]>('platform_get_all'),
  detectInstalled: () => invoke<string[]>('platform_detect_installed'),
  installSkill: (skillId: string, platformId: string, installMode: string) =>
    invoke<void>('platform_install_skill', { skillId, platformId, installMode }),
  uninstallSkill: (skillName: string, platformId: string) =>
    invoke<boolean>('platform_uninstall_skill', { skillName, platformId }),
  checkSkillStatus: (skillName: string, platformIds: string[]) =>
    invoke<SkillInstallStatus[]>('platform_check_skill_status', { skillName, platformIds }),
  getAllDeployedSkills: () => invoke<string[]>('platform_get_all_deployed_skills'),
};
