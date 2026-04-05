import { arrayMove } from '@dnd-kit/sortable';
import type { Folder } from '@/types';
import { FolderTreeNode, buildFolderTree, MAX_FOLDER_DEPTH } from '@/stores/folder.store';

export interface FlattenedItem extends Folder {
  parentId: string | null;
  depth: number;
  index: number;
}

export const indentationWidth = 24;
const horizontalDragDeadzoneRatio = 0.35;

export function getFlattenedTree(folders: Folder[], expandedIds: Set<string>): FlattenedItem[] {
  const tree = buildFolderTree(folders);
  const flattened: FlattenedItem[] = [];
  
  function flatten(nodes: FolderTreeNode[], parentId: string | null = null, depth = 0) {
    for (const node of nodes) {
      flattened.push({
        ...node,
        parentId,
        depth,
        index: flattened.length,
      });
      
      if (expandedIds.has(node.id) && node.children.length > 0) {
        flatten(node.children, node.id, depth + 1);
      }
    }
  }
  
  flatten(tree);
  return flattened;
}

export function getProjection(
  items: FlattenedItem[],
  activeId: string,
  overId: string,
  dragOffset: number,
  indentationWidth: number
) {
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  
  const dragThreshold = indentationWidth * horizontalDragDeadzoneRatio;
  const adjustedOffset =
    Math.abs(dragOffset) < dragThreshold
      ? 0
      : dragOffset - Math.sign(dragOffset) * dragThreshold;
  const dragDepth = Math.round(adjustedOffset / indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  
  let maxDepth = MAX_FOLDER_DEPTH - 1;
  if (previousItem) {
    maxDepth = previousItem.depth + 1;
  } else {
    maxDepth = 0;
  }
  
  let minDepth = 0;
  if (nextItem) {
    minDepth = nextItem.depth;
    if (dragDepth < 0) {
      minDepth = 0;
    }
  }
  
  let depth = projectedDepth;
  if (depth > maxDepth) depth = maxDepth;
  if (depth < minDepth) depth = minDepth;
  
  depth = Math.max(0, Math.min(depth, MAX_FOLDER_DEPTH - 1));
  
  return { depth, parentId: getParentId() };
  
  function getParentId() {
    if (depth === 0 || !previousItem) return null;
    if (depth === previousItem.depth) return previousItem.parentId;
    if (depth > previousItem.depth) return previousItem.id;
    
    const newParentItem = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth);
      
    return newParentItem ? newParentItem.parentId : null;
  }
}

export function removeChildrenOf(items: FlattenedItem[], ids: string[]) {
  const excludeParentIds = new Set(ids);
  return items.filter((item) => {
    if (item.parentId && excludeParentIds.has(item.parentId)) {
      excludeParentIds.add(item.id);
      return false;
    }
    return true;
  });
}
