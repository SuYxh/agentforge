import type { Skill } from "@/types";
import { platformApi } from "@/services/tauri-api";

export type SkillInstallMode = "copy" | "symlink";

export interface BatchSkillSyncFailure {
  skillName: string;
  platformId: string;
  reason: string;
}

export interface BatchSkillSyncProgress {
  current: number;
  total: number;
  skillName: string;
  platformId: string;
}

export interface BatchSkillSyncResult {
  successCount: number;
  totalCount: number;
  failures: BatchSkillSyncFailure[];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function syncSkillsToPlatforms(
  skills: Skill[],
  platformIds: string[],
  installMode: SkillInstallMode,
  onProgress?: (progress: BatchSkillSyncProgress) => void,
): Promise<BatchSkillSyncResult> {
  if (skills.length === 0 || platformIds.length === 0) {
    return { successCount: 0, totalCount: 0, failures: [] };
  }

  const totalCount = skills.length * platformIds.length;
  let current = 0;
  let successCount = 0;
  const failures: BatchSkillSyncFailure[] = [];

  for (const skill of skills) {
    for (const platformId of platformIds) {
      current += 1;
      onProgress?.({
        current,
        total: totalCount,
        skillName: skill.name,
        platformId,
      });

      try {
        await platformApi.installSkill(skill.id, platformId, installMode);
        successCount += 1;
      } catch (error) {
        failures.push({
          skillName: skill.name,
          platformId,
          reason: getErrorMessage(error),
        });
      }
    }
  }

  return {
    successCount,
    totalCount,
    failures,
  };
}

export async function unsyncSkillsFromPlatforms(
  skills: Skill[],
  platformIds: string[],
  onProgress?: (progress: BatchSkillSyncProgress) => void,
): Promise<BatchSkillSyncResult> {
  if (skills.length === 0 || platformIds.length === 0) {
    return { successCount: 0, totalCount: 0, failures: [] };
  }

  const totalCount = skills.length * platformIds.length;
  let current = 0;
  let successCount = 0;
  const failures: BatchSkillSyncFailure[] = [];

  for (const skill of skills) {
    for (const platformId of platformIds) {
      current += 1;
      onProgress?.({
        current,
        total: totalCount,
        skillName: skill.name,
        platformId,
      });

      try {
        await platformApi.uninstallSkill(skill.name, platformId);
        successCount += 1;
      } catch (error) {
        failures.push({
          skillName: skill.name,
          platformId,
          reason: getErrorMessage(error),
        });
      }
    }
  }

  return {
    successCount,
    totalCount,
    failures,
  };
}
