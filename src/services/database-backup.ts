import type { Skill, SkillVersion, SkillFileSnapshot, SkillLocalFileEntry } from "@/types";
import {
  promptApi,
  folderApi,
  skillApi,
  backupApi,
  imageApi,
  videoApi,
} from "@/services/tauri-api";
import {
  getAiConfigSnapshot,
  getSettingsStateSnapshot,
  restoreAiConfigSnapshot,
  restoreSettingsStateSnapshot,
} from "@/services/settings-snapshot";

export interface DatabaseBackup {
  version: number;
  exportedAt: string;
  prompts: any[];
  folders: any[];
  versions: any[];
  images?: { [fileName: string]: string };
  videos?: { [fileName: string]: string };
  aiConfig?: {
    aiModels?: any[];
    aiProvider?: string;
    aiApiKey?: string;
    aiApiUrl?: string;
    aiModel?: string;
  };
  settings?: { state: any };
  settingsUpdatedAt?: string;
  skills?: Skill[];
  skillVersions?: SkillVersion[];
  skillFiles?: {
    [skillId: string]: SkillFileSnapshot[];
  };
}

export type ExportScope = {
  prompts?: boolean;
  folders?: boolean;
  versions?: boolean;
  images?: boolean;
  aiConfig?: boolean;
  settings?: boolean;
  skills?: boolean;
};

export type AgentForgeFile =
  | {
      kind: "agentforge-export";
      exportedAt: string;
      scope: Required<ExportScope>;
      payload: Partial<DatabaseBackup>;
    }
  | { kind: "agentforge-backup"; exportedAt: string; payload: DatabaseBackup };

const DB_VERSION = 1;
const IMAGE_BATCH_SIZE = 10;
const IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const IMAGE_MAX_COUNT = 500;
const VIDEO_BATCH_SIZE = 5;
const VIDEO_MAX_SIZE_BYTES = 100 * 1024 * 1024;
const VIDEO_MAX_COUNT = 100;
const SKILL_CONCURRENCY = 5;

async function processBatched<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

async function collectImages(
  prompts: any[],
): Promise<{ [fileName: string]: string }> {
  const images: { [fileName: string]: string } = {};
  const imageFileNames = new Set<string>();

  for (const prompt of prompts) {
    if (prompt.images && Array.isArray(prompt.images)) {
      for (const img of prompt.images) {
        imageFileNames.add(img);
      }
    }
  }

  const allNames = Array.from(imageFileNames);
  if (allNames.length > IMAGE_MAX_COUNT) {
    console.warn(
      `Image count (${allNames.length}) exceeds limit (${IMAGE_MAX_COUNT}), truncating`,
    );
  }
  const namesToProcess = allNames.slice(0, IMAGE_MAX_COUNT);

  await processBatched(namesToProcess, IMAGE_BATCH_SIZE, async (fileName) => {
    try {
      const size = await imageApi.getSize(fileName);
      if (size != null && size > IMAGE_MAX_SIZE_BYTES) {
        console.warn(
          `Skipping image ${fileName}: size ${(size / 1024 / 1024).toFixed(1)}MB exceeds ${IMAGE_MAX_SIZE_BYTES / 1024 / 1024}MB limit`,
        );
        return;
      }

      const base64 = await imageApi.readBase64(fileName);
      if (base64) {
        images[fileName] = base64;
      }
    } catch (error) {
      console.warn(`Failed to read image ${fileName}:`, error);
    }
  });

  return images;
}

async function collectVideos(
  prompts: any[],
): Promise<{ [fileName: string]: string }> {
  const videos: { [fileName: string]: string } = {};
  const videoFileNames = new Set<string>();

  for (const prompt of prompts) {
    if (prompt.videos && Array.isArray(prompt.videos)) {
      for (const video of prompt.videos) {
        videoFileNames.add(video);
      }
    }
  }

  const allNames = Array.from(videoFileNames);
  if (allNames.length > VIDEO_MAX_COUNT) {
    console.warn(
      `Video count (${allNames.length}) exceeds limit (${VIDEO_MAX_COUNT}), truncating`,
    );
  }
  const namesToProcess = allNames.slice(0, VIDEO_MAX_COUNT);

  await processBatched(namesToProcess, VIDEO_BATCH_SIZE, async (fileName) => {
    try {
      const size = await videoApi.getSize(fileName);
      if (size != null && size > VIDEO_MAX_SIZE_BYTES) {
        console.warn(
          `Skipping video ${fileName}: size ${(size / 1024 / 1024).toFixed(1)}MB exceeds ${VIDEO_MAX_SIZE_BYTES / 1024 / 1024}MB limit`,
        );
        return;
      }

      const base64 = await videoApi.readBase64(fileName);
      if (base64) {
        videos[fileName] = base64;
      }
    } catch (error) {
      console.warn(`Failed to read video ${fileName}:`, error);
    }
  });

  return videos;
}

async function collectSkillData(): Promise<{
  skills: Skill[];
  skillVersions: SkillVersion[];
  skillFiles: { [skillId: string]: SkillFileSnapshot[] };
}> {
  const skills: Skill[] = [];
  const skillVersions: SkillVersion[] = [];
  const skillFiles: { [skillId: string]: SkillFileSnapshot[] } = {};

  try {
    const allSkills: Skill[] = (await skillApi.getAll()) ?? [];
    skills.push(...allSkills);

    await processBatched(allSkills, SKILL_CONCURRENCY, async (skill) => {
      const [versionsResult, filesResult] = await Promise.allSettled([
        skillApi.versionGetAll(skill.id),
        skillApi.readLocalFiles(skill.id),
      ]);

      if (versionsResult.status === "fulfilled" && versionsResult.value) {
        skillVersions.push(...versionsResult.value);
      } else if (versionsResult.status === "rejected") {
        console.warn(
          `Failed to get versions for skill ${skill.name}:`,
          versionsResult.reason,
        );
      }

      if (filesResult.status === "fulfilled" && filesResult.value) {
        const fileSnapshots: SkillFileSnapshot[] = (
          filesResult.value as SkillLocalFileEntry[]
        )
          .filter((file) => !file.isDirectory)
          .map((file) => ({
            relativePath: file.path,
            content: file.content,
          }));

        if (fileSnapshots.length > 0) {
          skillFiles[skill.id] = fileSnapshots;
        }
      } else if (filesResult.status === "rejected") {
        console.warn(
          `Failed to read local files for skill ${skill.name}:`,
          filesResult.reason,
        );
      }
    });
  } catch (error) {
    console.warn("Failed to collect skill data:", error);
  }

  return { skills, skillVersions, skillFiles };
}

async function gzipText(text: string): Promise<Blob> {
  const stream = new Blob([text], { type: "application/json" })
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).blob();
}

async function gunzipToText(blob: Blob): Promise<string> {
  const stream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

export async function exportDatabase(options?: {
  skipVideoContent?: boolean;
}): Promise<DatabaseBackup> {
  const dbData = await backupApi.exportData();

  const prompts = await promptApi.getAll();
  const folders = await folderApi.getAll();

  const [images, videos, skillData] = await Promise.all([
    collectImages(prompts),
    options?.skipVideoContent ? Promise.resolve(undefined) : collectVideos(prompts),
    collectSkillData(),
  ]);

  const settingsSnapshot = getSettingsStateSnapshot({
    updatedAt: new Date().toISOString(),
  });

  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    prompts,
    folders,
    versions: dbData.versions ?? [],
    images,
    videos,
    aiConfig: getAiConfigSnapshot({ includeRootApiKey: true }),
    settings: settingsSnapshot ? { state: settingsSnapshot.state } : undefined,
    settingsUpdatedAt: settingsSnapshot?.settingsUpdatedAt,
    skills: skillData.skills.length > 0 ? skillData.skills : undefined,
    skillVersions:
      skillData.skillVersions.length > 0 ? skillData.skillVersions : undefined,
    skillFiles:
      Object.keys(skillData.skillFiles).length > 0
        ? skillData.skillFiles
        : undefined,
  };
}

export async function importDatabase(backup: DatabaseBackup): Promise<void> {
  const restoredSkillIdMap = new Map<string, string>();
  const restoredSkillsByName = new Map<string, Skill>();

  await backupApi.importData({
    version: backup.version,
    exportedAt: backup.exportedAt,
    prompts: backup.prompts,
    folders: backup.folders,
    versions: backup.versions,
    skills: null,
    skillVersions: null,
  });

  if (backup.images) {
    for (const [fileName, base64] of Object.entries(backup.images)) {
      try {
        await imageApi.saveBase64(fileName, base64);
      } catch (error) {
        console.warn(`Failed to restore image ${fileName}:`, error);
      }
    }
  }

  if (backup.videos) {
    for (const [fileName, base64] of Object.entries(backup.videos)) {
      try {
        await videoApi.saveBase64(fileName, base64);
      } catch (error) {
        console.warn(`Failed to restore video ${fileName}:`, error);
      }
    }
  }

  if (backup.aiConfig) {
    restoreAiConfigSnapshot(backup.aiConfig);
  }

  if (backup.settings) {
    restoreSettingsStateSnapshot(backup.settings);
  }

  try {
    await skillApi.deleteAll();
  } catch (error) {
    console.warn("Failed to clear existing skills:", error);
  }

  if (backup.skills && backup.skills.length > 0) {
    for (const skill of backup.skills) {
      if (!skill.name || typeof skill.name !== "string" || !skill.name.trim()) {
        console.warn("Skipping skill from backup with missing name:", skill.id);
        continue;
      }

      try {
        const {
          id: _id,
          created_at: _createdAt,
          updated_at: _updatedAt,
          ...createData
        } = skill;
        const restoredSkill = await skillApi.create(
          {
            ...createData,
            is_favorite: createData.is_favorite ?? false,
            protocol_type: createData.protocol_type ?? "skill",
            currentVersion: createData.currentVersion,
          },
          { skipInitialVersion: true },
        );
        if (restoredSkill) {
          restoredSkillIdMap.set(skill.id, restoredSkill.id);
          restoredSkillsByName.set(restoredSkill.name, restoredSkill);
        }
      } catch (error) {
        console.warn(`Failed to restore skill ${skill.name}:`, error);
      }
    }
  }

  if (backup.skillVersions && backup.skillVersions.length > 0) {
    const nextCurrentVersionBySkillId = new Map<string, number>();

    for (const version of backup.skillVersions) {
      try {
        const restoredSkillId =
          restoredSkillIdMap.get(version.skillId) ?? version.skillId;
        const remappedVersion: SkillVersion = {
          ...version,
          skillId: restoredSkillId,
        };
        await skillApi.insertVersionDirect(remappedVersion);
        nextCurrentVersionBySkillId.set(
          restoredSkillId,
          Math.max(
            nextCurrentVersionBySkillId.get(restoredSkillId) ?? 1,
            version.version + 1,
          ),
        );
      } catch (error) {
        console.warn(
          `Failed to restore skill version ${version.skillId}@${version.version}:`,
          error,
        );
      }
    }

    for (const [skillId, currentVersion] of nextCurrentVersionBySkillId) {
      try {
        await skillApi.update(skillId, { currentVersion });
      } catch (error) {
        console.warn(
          `Failed to restore current version for skill ${skillId}:`,
          error,
        );
      }
    }
  }

  if (backup.skillFiles) {
    for (const [skillKey, files] of Object.entries(backup.skillFiles)) {
      const restoredSkillId =
        restoredSkillIdMap.get(skillKey) ??
        restoredSkillsByName.get(skillKey)?.id ??
        skillKey;

      for (const file of files) {
        try {
          await skillApi.writeLocalFile(
            restoredSkillId,
            file.relativePath,
            file.content,
          );
        } catch (error) {
          console.warn(
            `Failed to restore skill file ${skillKey}/${file.relativePath}:`,
            error,
          );
        }
      }
    }
  }
}

export function getDatabaseInfo(): { name: string; description: string } {
  return {
    name: "AgentForgeDB",
    description: "数据存储在 SQLite 中，位于用户数据目录下",
  };
}

export async function downloadBackup(): Promise<void> {
  const backup = await exportDatabase();
  const file: AgentForgeFile = {
    kind: "agentforge-backup",
    exportedAt: backup.exportedAt,
    payload: backup,
  };
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `agentforge-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadCompressedBackup(): Promise<void> {
  const backup = await exportDatabase();
  const file: AgentForgeFile = {
    kind: "agentforge-backup",
    exportedAt: backup.exportedAt,
    payload: backup,
  };
  const gz = await gzipText(JSON.stringify(file));
  const url = URL.createObjectURL(gz);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agentforge-backup-${new Date().toISOString().split("T")[0]}.phub.gz`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadSelectiveExport(
  scope: ExportScope,
): Promise<void> {
  const normalized: Required<ExportScope> = {
    prompts: !!scope.prompts,
    folders: !!scope.folders,
    versions: !!scope.versions,
    images: !!scope.images,
    aiConfig: !!scope.aiConfig,
    settings: !!scope.settings,
    skills: !!scope.skills,
  };

  const payload: Partial<DatabaseBackup> = {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
  };

  if (normalized.prompts) payload.prompts = await promptApi.getAll();
  if (normalized.folders) payload.folders = await folderApi.getAll();
  if (normalized.versions) {
    const dbData = await backupApi.exportData();
    payload.versions = dbData.versions ?? [];
  }
  if (normalized.images) {
    const promptsForImages = payload.prompts || (await promptApi.getAll());
    payload.images = await collectImages(promptsForImages);
  }
  if (normalized.aiConfig) {
    payload.aiConfig = getAiConfigSnapshot({ includeRootApiKey: true });
  }
  if (normalized.settings) {
    const snap = getSettingsStateSnapshot({
      updatedAt: new Date().toISOString(),
    });
    if (snap) {
      payload.settings = { state: snap.state };
      payload.settingsUpdatedAt = snap.settingsUpdatedAt;
    }
  }
  if (normalized.skills) {
    const skillData = await collectSkillData();
    payload.skills = skillData.skills;
    payload.skillVersions = skillData.skillVersions;
    payload.skillFiles = skillData.skillFiles;
  }

  const file: AgentForgeFile = {
    kind: "agentforge-export",
    exportedAt: payload.exportedAt || new Date().toISOString(),
    scope: normalized,
    payload,
  };

  const gz = await gzipText(JSON.stringify(file));
  const url = URL.createObjectURL(gz);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agentforge-export-${new Date().toISOString().split("T")[0]}.phub.gz`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreFromFile(file: File): Promise<void> {
  const text = file.name.endsWith(".gz")
    ? await gunzipToText(file)
    : await file.text();
  const parsed = JSON.parse(text) as any;

  if (parsed?.kind === "agentforge-backup") {
    await importDatabase(parsed.payload as DatabaseBackup);
    return;
  }

  if (parsed?.kind === "agentforge-export") {
    throw new Error("选择性导出文件不支持导入，请使用全量备份/恢复文件");
  }

  await importDatabase(parsed as DatabaseBackup);
}

export async function restoreFromBackup(backup: DatabaseBackup): Promise<void> {
  await importDatabase(backup);
}
