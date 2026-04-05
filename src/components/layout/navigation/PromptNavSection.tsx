import { useTranslation } from 'react-i18next';
import {
  LayoutGridIcon,
  StarIcon,
} from 'lucide-react';
import { usePromptStore } from '@/stores/prompt.store';
import { useFolderStore } from '@/stores/folder.store';
import { useNavigationStore } from '@/stores/navigation.store';
import { NavLink } from './NavLink';

interface PromptNavSectionProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function PromptNavSection({ currentPage, onNavigate }: PromptNavSectionProps) {
  const { t } = useTranslation();
  const isActive = useNavigationStore((s) => s.activeModuleId === 'prompts');
  const setActiveModule = useNavigationStore((s) => s.setActiveModule);
  const prompts = usePromptStore((s) => s.prompts);
  const setPromptTypeFilter = usePromptStore((s) => s.setPromptTypeFilter);
  const selectedFolderId = useFolderStore((s) => s.selectedFolderId);
  const selectFolder = useFolderStore((s) => s.selectFolder);

  const favoriteCount = prompts.filter((p) => p.isFavorite).length;

  const nav = (action: () => void) => {
    if (!isActive) setActiveModule('prompts');
    action();
    if (currentPage !== 'home') onNavigate('home');
  };

  return (
    <div className="space-y-0.5">
      <NavLink
        icon={<LayoutGridIcon className="w-4 h-4" />}
        label={t('filter.all', '全部')}
        count={prompts.length}
        active={isActive && selectedFolderId === null && currentPage === 'home'}
        onClick={() => nav(() => { setPromptTypeFilter('all'); selectFolder(null); })}
      />
      <NavLink
        icon={<StarIcon className="w-4 h-4" />}
        label={t('nav.favorites')}
        count={favoriteCount}
        active={isActive && selectedFolderId === 'favorites' && currentPage === 'home'}
        onClick={() => nav(() => selectFolder('favorites'))}
      />
    </div>
  );
}
