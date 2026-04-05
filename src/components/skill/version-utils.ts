import type { SkillFileSnapshot, SkillLocalFileEntry, SkillVersion } from '@/types';

export interface SkillVersionFileDiffEntry {
  path: string;
  oldContent: string;
  newContent: string;
  unchanged: boolean;
}

function compareFilePath(a: string, b: string): number {
  const aSkillMd = a.toLowerCase() === 'skill.md';
  const bSkillMd = b.toLowerCase() === 'skill.md';
  if (aSkillMd && !bSkillMd) return -1;
  if (!aSkillMd && bSkillMd) return 1;
  return a.localeCompare(b);
}

function ensureSkillMdSnapshot(snapshots: SkillFileSnapshot[], fallbackContent: string): SkillFileSnapshot[] {
  if (snapshots.some((s) => s.relativePath.toLowerCase() === 'skill.md')) return snapshots;
  if (!fallbackContent.trim()) return snapshots;
  return [{ relativePath: 'SKILL.md', content: fallbackContent }, ...snapshots];
}

export function normalizeVersionSnapshot(snapshots?: SkillFileSnapshot[], fallbackContent = ''): SkillFileSnapshot[] {
  const normalized = (snapshots || []).filter((s): s is { relativePath: string; content: string } => !!s && typeof s.relativePath === 'string' && typeof s.content === 'string' && s.relativePath.trim().length > 0).map((s) => ({ relativePath: s.relativePath, content: s.content }));
  return ensureSkillMdSnapshot(normalized, fallbackContent);
}

export function snapshotsFromLocalFiles(files: SkillLocalFileEntry[], fallbackContent = ''): SkillFileSnapshot[] {
  const normalized = files.filter((file) => !file.isDirectory).map((file) => ({ relativePath: file.path, content: file.content }));
  return ensureSkillMdSnapshot(normalized, fallbackContent);
}

export function resolveVersionSnapshots(version: SkillVersion | null, fallbackContent = ''): SkillFileSnapshot[] {
  return normalizeVersionSnapshot(version?.filesSnapshot, fallbackContent);
}

export function buildVersionFileDiffEntries(oldSnapshots: SkillFileSnapshot[], newSnapshots: SkillFileSnapshot[]): SkillVersionFileDiffEntry[] {
  const oldMap = new Map(oldSnapshots.map((s) => [s.relativePath, s.content]));
  const newMap = new Map(newSnapshots.map((s) => [s.relativePath, s.content]));
  const paths = Array.from(new Set([...oldMap.keys(), ...newMap.keys()])).sort(compareFilePath);
  return paths.map((path) => {
    const oldContent = oldMap.get(path) || '';
    const newContent = newMap.get(path) || '';
    return { path, oldContent, newContent, unchanged: oldContent === newContent };
  });
}
