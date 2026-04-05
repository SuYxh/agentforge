import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Prompt, CreatePromptDTO, UpdatePromptDTO } from '../types';
import { promptApi } from '../services/tauri-api';
import { triggerSyncOnSave } from '@/hooks/useWebDAVSync';

export type SortBy = 'updatedAt' | 'createdAt' | 'title' | 'usageCount';
export type SortOrder = 'desc' | 'asc';
export type ViewMode = 'card' | 'list';

interface PromptState {
  prompts: Prompt[];
  selectedId: string | null;
  selectedIds: string[];
  isLoading: boolean;
  searchQuery: string;
  filterTags: string[];
  promptTypeFilter: 'all' | 'text' | 'image';
  sortBy: SortBy;
  sortOrder: SortOrder;
  viewMode: ViewMode;

  fetchPrompts: () => Promise<void>;
  createPrompt: (data: CreatePromptDTO) => Promise<Prompt>;
  updatePrompt: (id: string, data: UpdatePromptDTO) => Promise<void>;
  movePrompts: (ids: string[], folderId: string) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  selectPrompt: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  setSearchQuery: (query: string) => void;
  toggleFilterTag: (tag: string) => void;
  clearFilterTags: () => void;
  setPromptTypeFilter: (filter: 'all' | 'text' | 'image') => void;
  toggleFavorite: (id: string) => Promise<void>;
  togglePinned: (id: string) => Promise<void>;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  setViewMode: (viewMode: ViewMode) => void;
  incrementUsageCount: (id: string) => Promise<void>;
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      prompts: [],
      selectedId: null,
      selectedIds: [],
      isLoading: false,
      searchQuery: '',
      filterTags: [],
      promptTypeFilter: 'all',
      sortBy: 'updatedAt' as SortBy,
      sortOrder: 'desc' as SortOrder,
      viewMode: 'card' as ViewMode,

      fetchPrompts: async () => {
        set({ isLoading: true });
        try {
          const prompts = await promptApi.getAll();
          set({ prompts });
        } catch (error) {
          console.error('Failed to fetch prompts:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      createPrompt: async (data) => {
        const prompt = await promptApi.create({
          ...data,
          variables: data.variables || [],
          tags: data.tags || [],
        });
        set((state) => ({ prompts: [prompt, ...state.prompts] }));
        triggerSyncOnSave();
        return prompt;
      },

      updatePrompt: async (id, data) => {
        const updated = await promptApi.update(id, data);
        set((state) => ({
          prompts: state.prompts.map((p) => (p.id === id ? updated : p)),
        }));
        triggerSyncOnSave();
      },

      movePrompts: async (ids, folderId) => {
        await Promise.all(ids.map((id) => promptApi.update(id, { folderId })));
        set((state) => ({
          prompts: state.prompts.map((p) =>
            ids.includes(p.id) ? { ...p, folderId, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePrompt: async (id) => {
        await promptApi.delete(id);
        set((state) => ({
          prompts: state.prompts.filter((p) => p.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
          selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
        }));
        triggerSyncOnSave();
      },

      selectPrompt: (id) => set({
        selectedId: id,
        selectedIds: id ? [id] : []
      }),

      setSelectedIds: (ids) => set((state) => ({
        selectedIds: ids,
        selectedId: ids.length === 1 ? ids[0] : (ids.includes(state.selectedId || '') ? state.selectedId : null)
      })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleFilterTag: (tag) => set((state) => ({
        filterTags: state.filterTags.includes(tag)
          ? state.filterTags.filter(t => t !== tag)
          : [...state.filterTags, tag]
      })),

      clearFilterTags: () => set({ filterTags: [] }),

      setPromptTypeFilter: (filter) => set({ promptTypeFilter: filter }),

      toggleFavorite: async (id) => {
        const prompt = get().prompts.find((p) => p.id === id);
        if (prompt) {
          const updated = await promptApi.update(id, { isFavorite: !prompt.isFavorite });
          set((state) => ({
            prompts: state.prompts.map((p) => (p.id === id ? updated : p)),
          }));
        }
      },

      togglePinned: async (id) => {
        const prompt = get().prompts.find((p) => p.id === id);
        if (prompt) {
          const updated = await promptApi.update(id, { isPinned: !prompt.isPinned });
          set((state) => ({
            prompts: state.prompts.map((p) => (p.id === id ? updated : p)),
          }));
        }
      },

      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      setViewMode: (viewMode) => set({ viewMode }),

      incrementUsageCount: async (id) => {
        const prompt = get().prompts.find((p) => p.id === id);
        if (prompt) {
          const updated = await promptApi.update(id, { usageCount: (prompt.usageCount || 0) + 1 });
          set((state) => ({
            prompts: state.prompts.map((p) => (p.id === id ? updated : p)),
          }));
        }
      },
    }),
    {
      name: 'prompt-store',
      partialize: (state) => ({
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        viewMode: state.viewMode,
        promptTypeFilter: state.promptTypeFilter,
      }),
    }
  )
);
