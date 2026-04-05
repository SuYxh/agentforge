import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HashIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigation.store';
import { useModuleTags } from '@/hooks/useModuleTags';

export function TagCloudPanel() {
  const { t } = useTranslation();
  const isRailCollapsed = useNavigationStore((s) => s.isRailCollapsed);
  const activeModuleId = useNavigationStore((s) => s.activeModuleId);
  const isPanelCollapsed = useNavigationStore((s) => s.isTagPanelCollapsed);
  const togglePanelCollapsed = useNavigationStore((s) => s.toggleTagPanelCollapsed);
  const panelHeight = useNavigationStore((s) => s.tagPanelHeight);
  const setPanelHeight = useNavigationStore((s) => s.setTagPanelHeight);

  const { tags, filterTags, toggleFilterTag, clearFilterTags } = useModuleTags(activeModuleId);
  const [showAll, setShowAll] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = panelHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = dragStartY.current - ev.clientY;
      const next = Math.min(Math.max(dragStartHeight.current + delta, 80), 400);
      setPanelHeight(next);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panelHeight, setPanelHeight]);

  if (tags.length === 0 || isRailCollapsed || activeModuleId === 'prompts') return null;

  const visibleTags = showAll ? tags : tags.slice(0, 8);

  return (
    <div className="shrink-0 flex flex-col overflow-hidden" style={{ height: isPanelCollapsed ? 'auto' : `${panelHeight}px` }}>
      {!isPanelCollapsed && (
        <div
          className={`h-1 cursor-ns-resize hover:bg-primary/40 transition-colors z-30 shrink-0 mx-2 rounded-full ${isResizing ? 'bg-primary/60' : 'bg-transparent'}`}
          onMouseDown={handleResizeStart}
        />
      )}

      <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 dark:border-white/5 shrink-0">
        <button
          onClick={togglePanelCollapsed}
          className="flex items-center gap-1 text-xs font-semibold text-foreground/50 uppercase tracking-wider hover:text-foreground/80 transition-colors"
        >
          {isPanelCollapsed ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
          {t('nav.tags')}
        </button>
        {!isPanelCollapsed && (
          <div className="flex items-center gap-2">
            {filterTags.length > 0 && (
              <button onClick={clearFilterTags} className="text-xs text-primary hover:underline">
                {t('common.clear', '清空')}
              </button>
            )}
            {tags.length > 8 && (
              <button onClick={() => setShowAll(!showAll)} className="text-xs text-primary hover:underline">
                {showAll ? t('common.collapse') : `${t('common.showAll')} ${tags.length}`}
              </button>
            )}
          </div>
        )}
      </div>

      {!isPanelCollapsed && (
        <div className="flex-1 overflow-y-auto px-4 pb-3 scrollbar-hide">
          <div className="flex flex-wrap gap-1.5 pt-1">
            {visibleTags.map((tag, index) => (
              <button
                key={tag}
                onClick={() => toggleFilterTag(tag)}
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200 animate-in fade-in slide-in-from-left-1 ${
                  filterTags.includes(tag)
                    ? 'bg-primary text-white'
                    : 'bg-white/15 dark:bg-white/8 text-foreground/70 hover:bg-primary hover:text-white backdrop-blur-sm'
                }`}
              >
                <HashIcon className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
