import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGridIcon, ListIcon, FilterIcon, HashIcon, ArrowUpDownIcon } from 'lucide-react';
import { usePromptStore, SortBy, SortOrder } from '@/stores/prompt.store';

interface SortOption {
  label: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

interface PromptListHeaderProps {
  count: number;
}

export function PromptListHeader({ count }: PromptListHeaderProps) {
  const { t } = useTranslation();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [sortMenuPos, setSortMenuPos] = useState({ top: 0, right: 0 });
  const [tagMenuPos, setTagMenuPos] = useState({ top: 0, left: 0 });
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const tagButtonRef = useRef<HTMLButtonElement>(null);

  const sortBy = usePromptStore((state) => state.sortBy);
  const sortOrder = usePromptStore((state) => state.sortOrder);
  const viewMode = usePromptStore((state) => state.viewMode);
  const setSortBy = usePromptStore((state) => state.setSortBy);
  const setSortOrder = usePromptStore((state) => state.setSortOrder);
  const setViewMode = usePromptStore((state) => state.setViewMode);

  const prompts = usePromptStore((state) => state.prompts);
  const filterTags = usePromptStore((state) => state.filterTags);
  const toggleFilterTag = usePromptStore((state) => state.toggleFilterTag);
  const clearFilterTags = usePromptStore((state) => state.clearFilterTags);

  const allTags = useMemo(
    () => [...new Set(prompts.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b)),
    [prompts],
  );

  const sortOptions: SortOption[] = [
    { label: t('prompt.sortNewest'), sortBy: 'updatedAt', sortOrder: 'desc' },
    { label: t('prompt.sortOldest'), sortBy: 'updatedAt', sortOrder: 'asc' },
    { label: t('prompt.sortTitleAsc'), sortBy: 'title', sortOrder: 'asc' },
    { label: t('prompt.sortTitleDesc'), sortBy: 'title', sortOrder: 'desc' },
    { label: t('prompt.sortMostUsed'), sortBy: 'usageCount', sortOrder: 'desc' },
    { label: t('prompt.sortLeastUsed'), sortBy: 'usageCount', sortOrder: 'asc' },
  ];

  const currentOption = sortOptions.find(
    (opt) => opt.sortBy === sortBy && opt.sortOrder === sortOrder
  ) || sortOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (isSortOpen && sortDropdownRef.current && !sortDropdownRef.current.contains(target) &&
          sortButtonRef.current && !sortButtonRef.current.contains(target)) {
        setIsSortOpen(false);
      }
      if (isTagFilterOpen && tagDropdownRef.current && !tagDropdownRef.current.contains(target) &&
          tagButtonRef.current && !tagButtonRef.current.contains(target)) {
        setIsTagFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen, isTagFilterOpen]);

  const handleToggleSortMenu = useCallback(() => {
    if (!isSortOpen && sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      setSortMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setIsSortOpen((v) => !v);
    setIsTagFilterOpen(false);
  }, [isSortOpen]);

  const handleToggleTagFilter = useCallback(() => {
    if (!isTagFilterOpen && tagButtonRef.current) {
      const rect = tagButtonRef.current.getBoundingClientRect();
      setTagMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    setIsTagFilterOpen((v) => !v);
    setIsSortOpen(false);
  }, [isTagFilterOpen]);

  const handleSelectSort = (option: SortOption) => {
    setSortBy(option.sortBy);
    setSortOrder(option.sortOrder);
    setIsSortOpen(false);
  };

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border glass sticky top-0 z-20">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {t('prompt.promptCount', { count })}
      </span>

      <div className="flex items-center gap-1">
        <div className="relative shrink-0">
          <button
            ref={sortButtonRef}
            onClick={handleToggleSortMenu}
            className="flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowUpDownIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{currentOption.label}</span>
          </button>

          {isSortOpen && createPortal(
            <div 
              ref={sortDropdownRef}
              className="fixed w-32 py-1 rounded-lg bg-popover border border-border shadow-lg z-[9999]"
              style={{ top: sortMenuPos.top, right: sortMenuPos.right }}
            >
              {sortOptions.map((option) => (
                <button
                  key={`${option.sortBy}-${option.sortOrder}`}
                  onClick={() => handleSelectSort(option)}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-accent transition-colors ${option.sortBy === sortBy && option.sortOrder === sortOrder
                    ? 'text-primary font-medium'
                    : 'text-foreground'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>

        {allTags.length > 0 && (
          <div className="relative shrink-0">
            <button
              ref={tagButtonRef}
              onClick={handleToggleTagFilter}
              className={`relative flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap rounded-md transition-colors ${
                filterTags.length > 0
                  ? 'text-primary bg-primary/10 hover:bg-primary/15'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <FilterIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{t('nav.tags', '标签')}</span>
              {filterTags.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-white text-[10px] font-bold leading-none ring-2 ring-background">
                  {filterTags.length}
                </span>
              )}
            </button>

            {isTagFilterOpen && createPortal(
              <div
                ref={tagDropdownRef}
                className="fixed w-64 rounded-lg bg-popover border border-border shadow-lg z-[9999] overflow-hidden"
                style={{ top: tagMenuPos.top, left: tagMenuPos.left }}
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium text-foreground">{t('nav.tags', '标签')}</span>
                  {filterTags.length > 0 && (
                    <button
                      onClick={clearFilterTags}
                      className="text-[11px] text-primary hover:text-primary/80 transition-colors"
                    >
                      {t('common.clear', '清空')}
                    </button>
                  )}
                </div>
                <div className="px-3 py-2 max-h-64 overflow-y-auto scrollbar-hide">
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleFilterTag(tag)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
                          filterTags.includes(tag)
                            ? 'bg-primary text-white'
                            : 'bg-muted text-foreground/60 hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        <HashIcon className="w-3 h-3" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}

        <div className="relative flex items-center rounded-md border border-border overflow-hidden bg-muted/30">
          <div
            className="absolute h-full bg-primary rounded-[3px] transition-all duration-200 ease-out"
            style={{
              width: '50%',
              left: viewMode === 'card' ? '0%' : '50%',
            }}
          />
          <button
            onClick={() => setViewMode('card')}
            className={`relative z-10 p-1.5 transition-colors duration-200 ${viewMode === 'card'
              ? 'text-white'
              : 'text-muted-foreground hover:text-foreground'
              }`}
            title={t('prompt.viewCard')}
          >
            <LayoutGridIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`relative z-10 p-1.5 transition-colors duration-200 ${viewMode === 'list'
              ? 'text-white'
              : 'text-muted-foreground hover:text-foreground'
              }`}
            title={t('prompt.viewList')}
          >
            <ListIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
