import type { Skill } from '@/types';

function normalizeString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value !== 'string') {
    return [];
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return normalizeStringArray(parsed);
    }
  } catch {
    // Fall through
  }
  return trimmed.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
}

export function normalizeSkill(skill: Skill): Skill {
  return {
    ...skill,
    tags: normalizeStringArray(skill.tags),
    original_tags: normalizeStringArray(skill.original_tags),
    prerequisites: normalizeStringArray(skill.prerequisites),
    compatibility: normalizeStringArray(skill.compatibility),
    created_at: normalizeNumber(skill.created_at) ?? 0,
    updated_at: normalizeNumber(skill.updated_at) ?? normalizeNumber(skill.created_at) ?? 0,
    currentVersion: normalizeNumber(skill.currentVersion) ?? 0,
    author: normalizeString(skill.author),
    description: normalizeString(skill.description),
    content: normalizeString(skill.content),
    instructions: normalizeString(skill.instructions),
  };
}

export function normalizeSkills(skills: Skill[]): Skill[] {
  return skills.map((skill) => normalizeSkill(skill));
}
