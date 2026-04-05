import { useCallback } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigation.store';

interface NavModuleProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  children: React.ReactNode;
}

export function NavModule({ id, icon, label, count, children }: NavModuleProps) {
  const isExpanded = useNavigationStore((s) => !!s.expandedModules[id]);
  const toggleExpanded = useNavigationStore((s) => s.toggleModuleExpanded);

  const handleClick = useCallback(() => {
    toggleExpanded(id);
  }, [id, toggleExpanded]);

  return (
    <div className="mb-0.5">
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-foreground/70 hover:bg-white/10 dark:hover:bg-white/5 hover:text-foreground"
      >
        <span className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</span>
        <span className="flex-1 text-left truncate">{label}</span>
        {count !== undefined && (
          <span className="text-[10px] tabular-nums text-foreground/40 mr-1">{count}</span>
        )}
        <ChevronRightIcon
          className={`w-3.5 h-3.5 text-foreground/30 transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="ml-3 pl-3 mt-0.5 border-l border-white/8 dark:border-white/5">
          {children}
        </div>
      )}
    </div>
  );
}
