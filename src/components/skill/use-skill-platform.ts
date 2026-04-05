import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Skill, SkillPlatform } from '@/types';
import { useSkillStore } from '@/stores/skill.store';
import { platformApi } from '@/services/tauri-api';
import { SKILL_PLATFORMS } from '@/constants/platforms';

export type SkillInstallMode = 'copy' | 'symlink';

export interface BatchInstallResult {
  successCount: number;
  totalCount: number;
}

export function useSkillPlatform(skill: Skill | null | undefined, installMode: SkillInstallMode) {
  const loadDeployedStatus = useSkillStore((state) => state.loadDeployedStatus);
  const [detectedPlatformIds, setDetectedPlatformIds] = useState<Set<string>>(new Set());
  const [installStatus, setInstallStatus] = useState<Record<string, boolean>>({});
  const [installModes, setInstallModes] = useState<Record<string, string>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [isBatchInstalling, setIsBatchInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState<{ current: number; total: number } | null>(null);

  const loadPlatforms = useCallback(async () => {
    try {
      const ids = await platformApi.detectInstalled();
      setDetectedPlatformIds(new Set(ids));
    } catch {
      setDetectedPlatformIds(new Set(SKILL_PLATFORMS.map((p) => p.id)));
    }
  }, []);

  const refreshInstallStatus = useCallback(async () => {
    if (!skill) return;
    try {
      const allPlatformIds = SKILL_PLATFORMS.map((p) => p.id);
      const statuses = await platformApi.checkSkillStatus(skill.name, allPlatformIds);
      const statusMap: Record<string, boolean> = {};
      const modeMap: Record<string, string> = {};
      for (const s of statuses) {
        statusMap[s.platform_id] = s.installed;
        if (s.install_mode) modeMap[s.platform_id] = s.install_mode;
      }
      setInstallStatus(statusMap);
      setInstallModes(modeMap);
      setSelectedPlatforms(new Set());
    } catch {
      setInstallStatus({});
      setInstallModes({});
      setSelectedPlatforms(new Set());
    }
    await loadDeployedStatus();
  }, [loadDeployedStatus, skill]);

  useEffect(() => { void loadPlatforms(); }, [loadPlatforms]);
  useEffect(() => { if (!skill) return; void refreshInstallStatus(); }, [refreshInstallStatus, skill]);

  const availablePlatforms = SKILL_PLATFORMS as SkillPlatform[];
  const uninstalledPlatforms = useMemo(() => availablePlatforms.filter((p) => !installStatus[p.id]), [availablePlatforms, installStatus]);

  const togglePlatformSelection = useCallback((platformId: string) => {
    setSelectedPlatforms((prev) => { const next = new Set(prev); if (next.has(platformId)) next.delete(platformId); else next.add(platformId); return next; });
  }, []);

  const selectAllPlatforms = useCallback(() => { setSelectedPlatforms(new Set(uninstalledPlatforms.map((p) => p.id))); }, [uninstalledPlatforms]);
  const deselectAllPlatforms = useCallback(() => { setSelectedPlatforms(new Set()); }, []);

  const batchInstall = useCallback(async (): Promise<BatchInstallResult> => {
    if (!skill || selectedPlatforms.size === 0) return { successCount: 0, totalCount: 0 };
    setIsBatchInstalling(true);
    const platformIds = Array.from(selectedPlatforms);
    setInstallProgress({ current: 0, total: platformIds.length });
    try {
      let successCount = 0;
      for (let i = 0; i < platformIds.length; i++) {
        setInstallProgress({ current: i + 1, total: platformIds.length });
        try {
          await platformApi.installSkill(skill.id, platformIds[i], installMode);
          successCount++;
        } catch (error) {
          console.error(`Failed to install "${skill.name}" to ${platformIds[i]}:`, error);
        }
      }
      await refreshInstallStatus();
      return { successCount, totalCount: platformIds.length };
    } finally {
      setIsBatchInstalling(false);
      setInstallProgress(null);
    }
  }, [installMode, refreshInstallStatus, selectedPlatforms, skill]);

  const uninstallFromPlatform = useCallback(async (platformId: string) => {
    if (!skill) return;
    try {
      await platformApi.uninstallSkill(skill.name, platformId);
    } catch (error) {
      console.error(`Failed to uninstall "${skill.name}" from ${platformId}:`, error);
    }
    await refreshInstallStatus();
  }, [refreshInstallStatus, skill]);

  return {
    availablePlatforms,
    detectedPlatformIds,
    installProgress,
    installStatus,
    installModes,
    isBatchInstalling,
    refreshInstallStatus,
    selectedPlatforms,
    togglePlatformSelection,
    selectAllPlatforms,
    deselectAllPlatforms,
    batchInstall,
    uninstallFromPlatform,
    uninstalledPlatforms,
  };
}
