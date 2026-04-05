import { create } from 'zustand';
import type { Folder, CreateFolderDTO, UpdateFolderDTO } from '../types';
import { folderApi } from '../services/tauri-api';

interface FolderState {
  folders: Folder[];
  selectedFolderId: string | null;
  expandedIds: Set<string>;
  unlockedFolderIds: Set<string>;

  fetchFolders: () => Promise<void>;
  createFolder: (data: CreateFolderDTO) => Promise<Folder>;
  updateFolder: (id: string, data: UpdateFolderDTO) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  selectFolder: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  unlockFolder: (id: string) => void;
  lockFolder: (id: string) => void;
  reorderFolders: (ids: string[]) => Promise<void>;
  moveFolder: (id: string, newParentId: string | null, newIndex: number) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  selectedFolderId: null,
  expandedIds: new Set(),
  unlockedFolderIds: new Set(),

  fetchFolders: async () => {
    try {
      const folders = await folderApi.getAll();
      set({ folders });
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  },

  createFolder: async (data) => {
    const folder = await folderApi.create({
      ...data,
    });
    set((state) => ({ folders: [...state.folders, folder] }));
    return folder;
  },

  updateFolder: async (id, data) => {
    try {
      const updated = await folderApi.update(id, data);
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? updated : f)),
      }));
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  },

  deleteFolder: async (id) => {
    await folderApi.delete(id);
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      selectedFolderId:
        state.selectedFolderId === id ? null : state.selectedFolderId,
    }));
  },

  selectFolder: (id) =>
    set((state) => {
      if (id !== state.selectedFolderId) {
        return {
          selectedFolderId: id,
          unlockedFolderIds: new Set(),
        };
      }
      return { selectedFolderId: id };
    }),

  toggleExpand: (id) =>
    set((state) => {
      const newExpanded = new Set(state.expandedIds);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { expandedIds: newExpanded };
    }),

  unlockFolder: (id) =>
    set((state) => {
      const newUnlocked = new Set(state.unlockedFolderIds);
      newUnlocked.add(id);
      return { unlockedFolderIds: newUnlocked };
    }),

  lockFolder: (id) =>
    set((state) => {
      const newUnlocked = new Set(state.unlockedFolderIds);
      newUnlocked.delete(id);
      return { unlockedFolderIds: newUnlocked };
    }),

  moveFolder: async (id, newParentId, newIndex) => {
    try {
      const { folders } = get();
      const folderToMove = folders.find(f => f.id === id);
      if (!folderToMove) return;
      if (newParentId && !canSetParent(folders, id, newParentId)) return;

      const now = new Date().toISOString();
      const nextFolder = { ...folderToMove, parentId: newParentId || undefined, order: newIndex, updatedAt: now };

      const otherFolders = folders.filter(f => f.id !== id);
      const newSiblings = otherFolders
        .filter(f => (newParentId ? f.parentId === newParentId : !f.parentId))
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      newSiblings.splice(newIndex, 0, nextFolder);

      const orderUpdates = newSiblings.map((f, index) => ({ id: f.id, order: index }));

      set((state) => ({
        folders: state.folders.map((f) => {
          if (f.id === id) return nextFolder;
          const update = orderUpdates.find((u) => u.id === f.id);
          if (update) return { ...f, order: update.order };
          return f;
        })
      }));

      await folderApi.update(id, { parentId: newParentId || undefined });
      await folderApi.reorder(orderUpdates);
    } catch (error) {
      console.error('Failed to move folder:', error);
    }
  },

  reorderFolders: async (ids) => {
    try {
      const updates = ids.map((id, index) => ({ id, order: index }));
      await folderApi.reorder(updates);

      set((state) => ({
        folders: ids.map((id, index) => {
          const folder = state.folders.find((f) => f.id === id)!;
          return { ...folder, order: index };
        }),
      }));
    } catch (error) {
      console.error('Failed to reorder folders:', error);
    }
  },
}));

export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
  depth: number;
}

export function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const folderMap = new Map<string, FolderTreeNode>();
  const rootNodes: FolderTreeNode[] = [];

  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [], depth: 0 });
  });

  folders.forEach(folder => {
    const node = folderMap.get(folder.id)!;
    if (folder.parentId && folderMap.has(folder.parentId)) {
      const parent = folderMap.get(folder.parentId)!;
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  function setDepth(nodes: FolderTreeNode[], depth: number) {
    nodes.forEach(node => {
      node.depth = depth;
      node.children.sort((a, b) => a.order - b.order);
      setDepth(node.children, depth + 1);
    });
  }
  rootNodes.sort((a, b) => a.order - b.order);
  setDepth(rootNodes, 0);

  return rootNodes;
}

export function getRootFolders(folders: Folder[]): Folder[] {
  return folders
    .filter(f => !f.parentId)
    .sort((a, b) => a.order - b.order);
}

export function getChildFolders(folders: Folder[], parentId: string): Folder[] {
  return folders
    .filter(f => f.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

export function getFolderPath(folders: Folder[], folderId: string): Folder[] {
  const path: Folder[] = [];
  let current = folders.find(f => f.id === folderId);

  while (current) {
    path.unshift(current);
    current = current.parentId
      ? folders.find(f => f.id === current!.parentId)
      : undefined;
  }

  return path;
}

export function getFolderDepth(folders: Folder[], folderId: string): number {
  return getFolderPath(folders, folderId).length - 1;
}

export function getAllDescendantIds(folders: Folder[], folderId: string): Set<string> {
  const descendants = new Set<string>();

  function collectDescendants(parentId: string) {
    folders.forEach(folder => {
      if (folder.parentId === parentId && !descendants.has(folder.id)) {
        descendants.add(folder.id);
        collectDescendants(folder.id);
      }
    });
  }

  collectDescendants(folderId);
  return descendants;
}

export function getMaxDescendantDepth(folders: Folder[], folderId: string): number {
  let maxDepth = 0;
  function walk(parentId: string, depth: number) {
    folders.forEach(folder => {
      if (folder.parentId === parentId) {
        if (depth > maxDepth) maxDepth = depth;
        walk(folder.id, depth + 1);
      }
    });
  }
  walk(folderId, 1);
  return maxDepth;
}

export function canSetParent(folders: Folder[], folderId: string, newParentId: string | undefined): boolean {
  if (!newParentId) return true;
  if (folderId === newParentId) return false;

  const descendants = getAllDescendantIds(folders, folderId);
  if (descendants.has(newParentId)) return false;

  const parentDepth = getFolderDepth(folders, newParentId);
  const maxDescendantDepth = getMaxDescendantDepth(folders, folderId);
  return parentDepth + 1 + maxDescendantDepth <= MAX_FOLDER_DEPTH - 1;
}

export const MAX_FOLDER_DEPTH = 2;

export function canCreateInParent(folders: Folder[], parentId: string | undefined): boolean {
  if (!parentId) return true;
  const depth = getFolderDepth(folders, parentId);
  return depth < MAX_FOLDER_DEPTH - 1;
}
