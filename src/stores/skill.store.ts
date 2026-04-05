import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Skill,
  CreateSkillParams,
  UpdateSkillParams,
  RegistrySkill,
  SkillCategory,
  ScannedSkill,
  SkillStoreSource,
  SkillFileSnapshot,
} from '@/types';
import { skillApi, platformApi } from '@/services/tauri-api';
import { filterVisibleSkills } from '@/services/skill-filter';
import { normalizeSkill, normalizeSkills } from '@/services/skill-normalize';
import { triggerSyncOnSave } from '@/hooks/useWebDAVSync';
import { BUILTIN_SKILL_REGISTRY } from '@/constants/skill-registry';

export type SkillFilterType =
  | 'all'
  | 'favorites'
  | 'installed'
  | 'deployed'
  | 'pending';
export type SkillViewMode = 'gallery' | 'list';
export type SkillStoreView = 'my-skills' | 'distribution' | 'store';

const TRANSLATION_CACHE_MAX_SIZE = 200;
const TRANSLATION_CACHE_EVICT_COUNT = 50;
const TRANSLATION_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const REMOTE_CONTENT_CONCURRENCY = 6;

interface TranslationCacheEntry {
  value: string;
  timestamp: number;
}

export interface ScannedImportResult {
  importedCount: number;
  skipped: Array<{ name: string; reason: string }>;
  failed: Array<{ name: string; reason: string }>;
}

function pruneTranslationCache(
  cache: Record<string, TranslationCacheEntry>,
): Record<string, TranslationCacheEntry> {
  const now = Date.now();
  const entries = Object.entries(cache).filter(
    ([, entry]) => now - entry.timestamp < TRANSLATION_CACHE_TTL,
  );
  if (entries.length > TRANSLATION_CACHE_MAX_SIZE) {
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const trimmed = entries.slice(
      entries.length - (TRANSLATION_CACHE_MAX_SIZE - TRANSLATION_CACHE_EVICT_COUNT),
    );
    return Object.fromEntries(trimmed);
  }
  return Object.fromEntries(entries);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isGitHubTreeEntry(
  value: unknown,
): value is { path: string; type: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    typeof value.path === 'string' &&
    'type' in value &&
    typeof value.type === 'string'
  );
}

interface ParsedGitHubSkillLocation {
  owner: string;
  repo: string;
  branch: string;
  directoryPath: string;
}

function parseGitHubSkillLocation(
  sourceUrl?: string,
  contentUrl?: string,
): ParsedGitHubSkillLocation | null {
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl);
      if (parsed.hostname.toLowerCase() === 'github.com') {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 5 && parts[2] === 'tree') {
          return {
            owner: parts[0],
            repo: parts[1],
            branch: parts[3],
            directoryPath: parts.slice(4).join('/'),
          };
        }
      }
    } catch {
      // ignore
    }
  }
  if (contentUrl) {
    try {
      const parsed = new URL(contentUrl);
      if (parsed.hostname.toLowerCase() === 'raw.githubusercontent.com') {
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 5) {
          return {
            owner: parts[0],
            repo: parts[1],
            branch: parts[2],
            directoryPath: parts.slice(3, -1).join('/'),
          };
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function shouldSyncRemoteRepoFile(relativePath: string): boolean {
  const ext = relativePath.includes('.')
    ? relativePath.slice(relativePath.lastIndexOf('.')).toLowerCase()
    : '';
  return (
    ext === '' ||
    [
      '.md', '.mdx', '.txt', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg',
      '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.rb', '.go', '.rs',
      '.java', '.kt', '.swift', '.sh', '.bash', '.zsh', '.ps1', '.html', '.css',
      '.svg', '.xml', '.sql', '.r', '.lua', '.php', '.c', '.cpp', '.h', '.hpp',
      '.cs', '.lock', '.gitignore', '.env',
    ].includes(ext)
  );
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  const runWorker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(items[currentIndex], currentIndex);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => runWorker()),
  );
}

async function syncRemoteGitHubSkillRepo(
  skillId: string,
  sourceUrl?: string,
  contentUrl?: string,
): Promise<void> {
  const location = parseGitHubSkillLocation(sourceUrl, contentUrl);
  if (!location || !location.directoryPath) return;

  const treeRaw = await skillApi.fetchRemoteContent(
    `https://api.github.com/repos/${location.owner}/${location.repo}/git/trees/${location.branch}?recursive=1`,
  );
  const treeData = parseJson<{ tree?: Array<{ path?: string; type?: string }> }>(
    treeRaw || '{}',
    {},
  );
  const directoryPrefix = `${location.directoryPath}/`;
  const files = Array.isArray(treeData.tree)
    ? treeData.tree.filter(
        (entry): entry is { path: string; type: string } =>
          isGitHubTreeEntry(entry) &&
          entry.type === 'blob' &&
          entry.path.startsWith(directoryPrefix),
      )
    : [];

  await runWithConcurrency(files, REMOTE_CONTENT_CONCURRENCY, async (file) => {
    const relativePath = file.path.slice(directoryPrefix.length);
    if (!relativePath || !shouldSyncRemoteRepoFile(relativePath)) return;
    const rawUrl = `https://raw.githubusercontent.com/${location.owner}/${location.repo}/${location.branch}/${file.path}`;
    const content = await skillApi.fetchRemoteContent(rawUrl);
    await skillApi.writeLocalFile(skillId, relativePath, content);
  });
}

function validateStoreSourceUrl(url: string): string {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('INVALID_STORE_SOURCE_URL');
  }
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('STORE_SOURCE_HTTPS_REQUIRED');
  }
  return parsedUrl.toString();
}

interface SkillState {
  skills: Skill[];
  selectedSkillId: string | null;
  isLoading: boolean;
  error: string | null;
  viewMode: SkillViewMode;
  searchQuery: string;
  filterType: SkillFilterType;
  storeView: SkillStoreView;
  registrySkills: RegistrySkill[];
  isLoadingRegistry: boolean;
  storeCategory: SkillCategory | 'all';
  storeSearchQuery: string;
  selectedRegistrySlug: string | null;
  customStoreSources: SkillStoreSource[];
  selectedStoreSourceId: string;
  remoteStoreEntries: Record<
    string,
    { loadedAt: number; error?: string | null; skills: RegistrySkill[] }
  >;
  deployedSkillNames: Set<string>;
  translationCache: Record<string, TranslationCacheEntry>;
  filterTags: string[];

  loadSkills: () => Promise<void>;
  selectSkill: (id: string | null) => void;
  createSkill: (data: CreateSkillParams) => Promise<Skill | null>;
  updateSkill: (id: string, data: UpdateSkillParams) => Promise<Skill | null>;
  deleteSkill: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<void>;
  scanLocalPreview: (customPaths?: string[]) => Promise<ScannedSkill[]>;
  importScannedSkills: (
    skills: ScannedSkill[],
    userTagsByPath?: Record<string, string[]>,
  ) => Promise<ScannedImportResult>;
  setViewMode: (mode: SkillViewMode) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (filter: SkillFilterType) => void;
  toggleFilterTag: (tag: string) => void;
  clearFilterTags: () => void;
  getFilteredSkills: () => Skill[];
  setStoreView: (view: SkillStoreView) => void;
  loadRegistry: () => void;
  installRegistrySkill: (skill: RegistrySkill) => Promise<Skill | null>;
  installFromRegistry: (slug: string) => Promise<Skill | null>;
  uninstallRegistrySkill: (slug: string) => Promise<boolean>;
  setStoreCategory: (category: SkillCategory | 'all') => void;
  setStoreSearchQuery: (query: string) => void;
  selectRegistrySkill: (slug: string | null) => void;
  selectStoreSource: (id: string) => void;
  upsertRegistrySkills: (skills: RegistrySkill[]) => void;
  addCustomStoreSource: (name: string, url: string, type?: SkillStoreSource['type']) => void;
  removeCustomStoreSource: (id: string) => void;
  toggleCustomStoreSource: (id: string) => void;
  setRemoteStoreEntry: (
    sourceId: string,
    entry: { loadedAt: number; error?: string | null; skills: RegistrySkill[] },
  ) => void;
  getInstalledSlugs: () => string[];
  getRecommendedSkills: () => RegistrySkill[];
  getFilteredRegistrySkills: () => { installed: RegistrySkill[]; recommended: RegistrySkill[] };
  loadDeployedStatus: () => Promise<void>;
  translateContent: (
    content: string,
    cacheKey: string,
    targetLang: string,
    options?: { forceRefresh?: boolean },
  ) => Promise<string | null>;
  getTranslation: (cacheKey: string) => string | null;
  clearTranslation: (cacheKey: string) => void;
}

export const useSkillStore = create<SkillState>()(
  persist(
    (set, get) => ({
      skills: [],
      selectedSkillId: null,
      isLoading: false,
      error: null,
      viewMode: 'gallery' as SkillViewMode,
      searchQuery: '',
      filterType: 'all',
      filterTags: [] as string[],
      deployedSkillNames: new Set<string>(),
      storeView: 'my-skills' as SkillStoreView,
      registrySkills: [] as RegistrySkill[],
      isLoadingRegistry: false,
      storeCategory: 'all' as SkillCategory | 'all',
      storeSearchQuery: '',
      selectedRegistrySlug: null,
      customStoreSources: [] as SkillStoreSource[],
      selectedStoreSourceId: 'official',
      remoteStoreEntries: {},
      translationCache: {} as Record<string, TranslationCacheEntry>,

      loadSkills: async () => {
        set({ isLoading: true, error: null });
        try {
          const skills = normalizeSkills(await skillApi.getAll());
          set({ skills, isLoading: false });
        } catch (error) {
          console.error('Failed to load skills:', error);
          set({ error: String(error), isLoading: false });
        }
      },

      loadDeployedStatus: async () => {
        try {
          const names = await platformApi.getAllDeployedSkills();
          set({ deployedSkillNames: new Set<string>(names) });
        } catch {
          set({ deployedSkillNames: new Set<string>() });
        }
      },

      selectSkill: (id) => set({ selectedSkillId: id }),

      createSkill: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const newSkill = await skillApi.create(data);
          if (newSkill) {
            let storedSkill = normalizeSkill(newSkill);
            const repoContent =
              data.instructions || data.content || newSkill.instructions || newSkill.content || '';
            if (typeof repoContent === 'string') {
              try {
                await skillApi.writeLocalFile(newSkill.id, 'SKILL.md', repoContent, {
                  skipVersionSnapshot: true,
                });
                const repoPath = await skillApi.getRepoPath(newSkill.id);
                if (repoPath) {
                  storedSkill = { ...newSkill, local_repo_path: repoPath };
                }
              } catch (repoError) {
                console.warn(
                  `Failed to write local repo for skill "${newSkill.name}":`,
                  repoError,
                );
              }
            }
            set((state) => ({
              skills: [storedSkill, ...state.skills],
              selectedSkillId: storedSkill.id,
              isLoading: false,
            }));
            triggerSyncOnSave();
            return storedSkill;
          }
          return null;
        } catch (error) {
          console.error('Failed to create skill:', error);
          set({ error: String(error), isLoading: false });
          throw error;
        }
      },

      updateSkill: async (id, data) => {
        try {
          const updatedSkill = await skillApi.update(id, data);
          if (updatedSkill) {
            let storedSkill = normalizeSkill(updatedSkill);
            const shouldSyncRepoContent =
              Object.prototype.hasOwnProperty.call(data, 'instructions') ||
              Object.prototype.hasOwnProperty.call(data, 'content');
            const nextContent =
              data.instructions ?? data.content ?? updatedSkill.instructions ?? updatedSkill.content;
            if (shouldSyncRepoContent && typeof nextContent === 'string') {
              try {
                await skillApi.writeLocalFile(id, 'SKILL.md', nextContent, {
                  skipVersionSnapshot: true,
                });
                const repoPath = await skillApi.getRepoPath(id);
                if (repoPath) {
                  storedSkill = { ...updatedSkill, local_repo_path: repoPath };
                }
              } catch (repoError) {
                console.warn(
                  `Failed to sync local repo for skill "${updatedSkill.name}":`,
                  repoError,
                );
              }
            }
            set((state) => ({
              skills: state.skills.map((s) => (s.id === id ? storedSkill : s)),
            }));
            triggerSyncOnSave();
            return storedSkill;
          }
          return null;
        } catch (error) {
          console.error('Failed to update skill:', error);
          throw error;
        }
      },

      deleteSkill: async (id) => {
        try {
          const success = await skillApi.delete(id);
          if (success) {
            set((state) => ({
              skills: state.skills.filter((s) => s.id !== id),
              selectedSkillId: state.selectedSkillId === id ? null : state.selectedSkillId,
            }));
            triggerSyncOnSave();
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to delete skill:', error);
          return false;
        }
      },

      toggleFavorite: async (id) => {
        const skill = get().skills.find((s) => s.id === id);
        if (!skill) return;
        try {
          const updatedSkill = await skillApi.update(id, {
            is_favorite: !skill.is_favorite,
          });
          if (updatedSkill) {
            set((state) => ({
              skills: state.skills.map((s) => (s.id === id ? updatedSkill : s)),
            }));
          }
        } catch (error) {
          console.error('Failed to toggle favorite:', error);
        }
      },

      scanLocalPreview: async (customPaths?: string[]) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: implement scanLocalPreview via Tauri command
          void customPaths;
          set({ isLoading: false });
          return [];
        } catch (error) {
          console.error('Failed to preview local skills:', error);
          set({ error: String(error), isLoading: false });
          return [];
        }
      },

      importScannedSkills: async (scannedSkills, userTagsByPath) => {
        set({ isLoading: true, error: null });
        try {
          let importCount = 0;
          const skipped: ScannedImportResult['skipped'] = [];
          const failed: ScannedImportResult['failed'] = [];

          for (const scanned of scannedSkills) {
            if (!scanned.name || scanned.name.trim().length === 0) {
              skipped.push({ name: scanned.localPath || 'unknown', reason: 'Missing skill name' });
              continue;
            }
            try {
              const userTags = userTagsByPath?.[scanned.localPath] ?? [];
              const newSkill = await skillApi.create({
                name: scanned.name,
                description: scanned.description,
                instructions: scanned.instructions,
                content: scanned.instructions,
                protocol_type: 'skill',
                version: scanned.version,
                author: scanned.author,
                tags: userTags,
                original_tags: scanned.tags,
                is_favorite: false,
                source_url: scanned.localPath,
              });
              if (scanned.localPath) {
                try {
                  const repoPath = await skillApi.saveToRepo(scanned.name, scanned.localPath);
                  if (repoPath && newSkill?.id) {
                    await skillApi.update(newSkill.id, { local_repo_path: repoPath });
                  }
                } catch (error: unknown) {
                  console.warn(
                    `Skill "${scanned.name}" imported but failed to copy files:`,
                    getErrorMessage(error),
                  );
                }
              }
              importCount++;
            } catch (error: unknown) {
              failed.push({
                name: scanned.name,
                reason: getErrorMessage(error) || 'Unknown import error',
              });
            }
          }
          const skills = normalizeSkills(await skillApi.getAll());
          set({ skills, isLoading: false });
          return { importedCount: importCount, skipped, failed };
        } catch (error) {
          console.error('Failed to import scanned skills:', error);
          set({ error: String(error), isLoading: false });
          return { importedCount: 0, skipped: [], failed: [{ name: 'scan', reason: String(error) }] };
        }
      },

      setViewMode: (mode) => set({ viewMode: mode }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterType: (filter) => set({ filterType: filter }),

      toggleFilterTag: (tag) => {
        const { filterTags } = get();
        if (filterTags.includes(tag)) {
          set({ filterTags: filterTags.filter((t) => t !== tag) });
        } else {
          set({ filterTags: [...filterTags, tag] });
        }
      },

      clearFilterTags: () => set({ filterTags: [] }),

      getFilteredSkills: () => {
        const { deployedSkillNames, filterTags, filterType, searchQuery, skills, storeView } = get();
        return filterVisibleSkills({
          deployedSkillNames,
          filterTags,
          filterType,
          searchQuery,
          skills,
          storeView,
        });
      },

      setStoreView: (view) => set({ storeView: view, selectedRegistrySlug: null }),

      loadRegistry: () => {
        set({ isLoadingRegistry: true });
        try {
          const registry = [...BUILTIN_SKILL_REGISTRY] as RegistrySkill[];
          set({ registrySkills: registry, isLoadingRegistry: false });

          const withUrls = registry.filter((s) => s.content_url);
          if (withUrls.length > 0) {
            (async () => {
              const updated = [...registry];
              let hasUpdates = false;
              await runWithConcurrency(updated, REMOTE_CONTENT_CONCURRENCY, async (skill, index) => {
                if (!skill.content_url) return;
                try {
                  const realContent = await skillApi.fetchRemoteContent(skill.content_url);
                  if (realContent && realContent.trim().length > 0) {
                    updated[index] = { ...skill, content: realContent };
                    hasUpdates = true;
                  }
                } catch {
                  // Silently fall back to embedded content
                }
              });
              if (hasUpdates) {
                set({ registrySkills: [...updated] });
              }
            })();
          }
        } catch {
          set({ registrySkills: [], isLoadingRegistry: false });
        }
      },

      installRegistrySkill: async (regSkill) => {
        try {
          let effectiveContent = regSkill.content;
          if (regSkill.content_url) {
            try {
              const freshContent = await skillApi.fetchRemoteContent(regSkill.content_url);
              if (freshContent.trim()) {
                effectiveContent = freshContent;
              }
            } catch (fetchError) {
              console.warn(
                `Failed to fetch fresh SKILL.md for "${regSkill.slug}", falling back:`,
                fetchError,
              );
            }
          }

          const newSkill = await skillApi.create({
            name: regSkill.slug,
            description: regSkill.description,
            instructions: effectiveContent,
            content: effectiveContent,
            protocol_type: 'skill',
            version: regSkill.version,
            author: regSkill.author,
            source_url: regSkill.source_url,
            tags: [],
            original_tags: regSkill.tags,
            is_favorite: false,
            icon_url: regSkill.icon_url,
            icon_emoji: regSkill.icon_emoji,
            category: regSkill.category,
            is_builtin: true,
            registry_slug: regSkill.slug,
            content_url: regSkill.content_url,
            prerequisites: regSkill.prerequisites,
            compatibility: regSkill.compatibility,
          });

          if (newSkill) {
            try {
              await skillApi.writeLocalFile(newSkill.id, 'SKILL.md', effectiveContent);
              await syncRemoteGitHubSkillRepo(newSkill.id, regSkill.source_url, regSkill.content_url);
            } catch (repoError) {
              console.warn(
                `Failed to create local repo for registry skill "${regSkill.slug}":`,
                repoError,
              );
            }
            await get().loadSkills();
            return newSkill;
          }
          return null;
        } catch (error: unknown) {
          throw new Error(getErrorMessage(error) || 'Failed to install skill');
        }
      },

      installFromRegistry: async (slug) => {
        const { registrySkills, installRegistrySkill } = get();
        const regSkill = registrySkills.find((s) => s.slug === slug);
        if (!regSkill) return null;
        return installRegistrySkill(regSkill);
      },

      uninstallRegistrySkill: async (slug) => {
        const { skills, loadSkills } = get();
        const skill = skills.find((s) => s.registry_slug === slug);
        if (!skill) return false;
        try {
          const success = await skillApi.delete(skill.id);
          if (success) {
            await loadSkills();
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to uninstall registry skill:', error);
          return false;
        }
      },

      setStoreCategory: (category) => set({ storeCategory: category }),
      setStoreSearchQuery: (query) => set({ storeSearchQuery: query }),
      selectRegistrySkill: (slug) => set({ selectedRegistrySlug: slug }),
      selectStoreSource: (id) => set({ selectedStoreSourceId: id }),

      upsertRegistrySkills: (incomingSkills) => {
        set((state) => {
          const merged = [...state.registrySkills];
          const indexBySlug = new Map(merged.map((skill, index) => [skill.slug, index]));
          for (const incoming of incomingSkills) {
            const index = indexBySlug.get(incoming.slug);
            if (index !== undefined && index >= 0) {
              merged[index] = { ...merged[index], ...incoming };
            } else {
              indexBySlug.set(incoming.slug, merged.length);
              merged.push(incoming);
            }
          }
          return { registrySkills: merged };
        });
      },

      addCustomStoreSource: (name, url, type = 'marketplace-json') => {
        const trimmedName = name.trim();
        const trimmedUrl = validateStoreSourceUrl(url.trim());
        if (!trimmedName || !trimmedUrl) return;
        const newId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        set((state) => ({
          customStoreSources: [
            {
              id: newId,
              name: trimmedName,
              type,
              url: trimmedUrl,
              enabled: true,
              order: state.customStoreSources.length,
              createdAt: Date.now(),
            },
            ...state.customStoreSources,
          ],
          selectedStoreSourceId: newId,
        }));
      },

      removeCustomStoreSource: (id) => {
        set((state) => {
          const nextSources = state.customStoreSources.filter((s) => s.id !== id);
          const nextRemote = { ...state.remoteStoreEntries };
          delete nextRemote[id];
          return {
            customStoreSources: nextSources,
            selectedStoreSourceId: state.selectedStoreSourceId === id ? 'official' : state.selectedStoreSourceId,
            remoteStoreEntries: nextRemote,
          };
        });
      },

      toggleCustomStoreSource: (id) => {
        set((state) => ({
          customStoreSources: state.customStoreSources.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s,
          ),
        }));
      },

      setRemoteStoreEntry: (sourceId, entry) => {
        set((state) => ({
          remoteStoreEntries: { ...state.remoteStoreEntries, [sourceId]: entry },
        }));
      },

      getInstalledSlugs: () => {
        return get()
          .skills.filter((s) => s.registry_slug)
          .map((s) => s.registry_slug!);
      },

      getRecommendedSkills: () => {
        const installedSlugs = get().getInstalledSlugs();
        return get().registrySkills.filter((s) => !installedSlugs.includes(s.slug));
      },

      getFilteredRegistrySkills: () => {
        const { registrySkills, skills, storeCategory, storeSearchQuery } = get();
        const installedSlugs = skills
          .filter((s) => s.registry_slug)
          .map((s) => s.registry_slug!);

        let filtered = registrySkills;
        if (storeCategory !== 'all') {
          filtered = filtered.filter((s) => s.category === storeCategory);
        }
        if (storeSearchQuery.trim()) {
          const q = storeSearchQuery.toLowerCase();
          filtered = filtered.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.description.toLowerCase().includes(q) ||
              s.tags.some((tag) => tag.toLowerCase().includes(q)),
          );
        }
        const installed = filtered.filter((s) => installedSlugs.includes(s.slug));
        const recommended = filtered.filter((s) => !installedSlugs.includes(s.slug));
        return { installed, recommended };
      },

      translateContent: async (content, cacheKey, targetLang, options) => {
        const cached = get().translationCache[cacheKey];
        if (
          !options?.forceRefresh &&
          cached &&
          Date.now() - cached.timestamp < TRANSLATION_CACHE_TTL
        ) {
          return cached.value;
        }
        // TODO: implement AI translation via chatCompletion service
        void content;
        void targetLang;
        return null;
      },

      getTranslation: (cacheKey) => {
        const entry = get().translationCache[cacheKey];
        if (!entry) return null;
        if (Date.now() - entry.timestamp >= TRANSLATION_CACHE_TTL) return null;
        return entry.value;
      },

      clearTranslation: (cacheKey) => {
        set((state) => {
          if (!state.translationCache[cacheKey]) return state;
          const nextCache = { ...state.translationCache };
          delete nextCache[cacheKey];
          return { translationCache: nextCache };
        });
      },
    }),
    {
      name: 'skill-store',
      partialize: (state) => ({
        viewMode: state.viewMode,
        filterType: state.filterType,
        storeView: state.storeView,
        customStoreSources: state.customStoreSources,
        selectedStoreSourceId: state.selectedStoreSourceId,
        remoteStoreEntries: state.remoteStoreEntries,
      }),
    },
  ),
);
