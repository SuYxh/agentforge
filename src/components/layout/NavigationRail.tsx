import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MessageSquareTextIcon,
  WrenchIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { useNavigationStore } from '@/stores/navigation.store';
import { usePromptStore } from '@/stores/prompt.store';
import { useSkillStore } from '@/stores/skill.store';
import { TrafficLights } from './TrafficLights';
import { NavModule } from './navigation/NavModule';
import { PromptNavSection } from './navigation/PromptNavSection';
import { SkillNavSection } from './navigation/SkillNavSection';
import { TagCloudPanel } from './navigation/TagCloudPanel';

type PageType = 'home' | 'settings';

interface NavigationRailProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

export function NavigationRail({ currentPage, onNavigate }: NavigationRailProps) {
  const { t } = useTranslation();
  const isCollapsed = useNavigationStore((s) => s.isRailCollapsed);
  const toggleCollapsed = useNavigationStore((s) => s.toggleRailCollapsed);
  const activeModuleId = useNavigationStore((s) => s.activeModuleId);
  const setActiveModule = useNavigationStore((s) => s.setActiveModule);

  const promptCount = usePromptStore((s) => s.prompts.length);
  const skillCount = useSkillStore((s) => s.skills.length);

  const [isMac, setIsMac] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    setIsMac(navigator.userAgent.toLowerCase().includes('mac'));
    const checkFullscreen = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const full = await getCurrentWindow().isFullscreen();
        setIsFullscreen(full);
      } catch {}
    };
    checkFullscreen();
    window.addEventListener('resize', checkFullscreen);
    return () => window.removeEventListener('resize', checkFullscreen);
  }, []);

  if (isCollapsed) {
    return (
      <aside className={`group relative z-20 glass-subtle border-r flex flex-col transition-all duration-300 ease-liquid ${isMac ? 'w-20' : 'w-16'}`}>
        {isMac && !isFullscreen && (
          <div className="h-12 titlebar-drag shrink-0 flex items-center pl-3" data-tauri-drag-region>
            <TrafficLights />
          </div>
        )}

        <div className="absolute top-1/2 -translate-y-1/2 -right-3 z-50 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
          <button
            onClick={toggleCollapsed}
            className="h-12 w-7 rounded-full border border-border bg-background shadow-sm hover:shadow-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-all duration-200"
            title={t('common.expand', '展开')}
          >
            <ChevronRightIcon className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 flex flex-col items-center gap-2 py-4 px-2">
          <button
            onClick={() => { setActiveModule('prompts'); if (currentPage !== 'home') onNavigate('home'); }}
            title={t('common.prompts')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
              activeModuleId === 'prompts' && currentPage === 'home'
                ? 'bg-primary text-white shadow-lg'
                : 'text-foreground/50 hover:bg-white/15 dark:hover:bg-white/8 hover:text-foreground'
            }`}
          >
            <MessageSquareTextIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setActiveModule('skills'); if (currentPage !== 'home') onNavigate('home'); }}
            title={t('common.skills')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
              activeModuleId === 'skills' && currentPage === 'home'
                ? 'bg-primary text-white shadow-lg'
                : 'text-foreground/50 hover:bg-white/15 dark:hover:bg-white/8 hover:text-foreground'
            }`}
          >
            <WrenchIcon className="w-5 h-5" />
          </button>
        </nav>

        <div className="p-2 border-t border-white/10 dark:border-white/5 flex flex-col items-center gap-1">
          <button
            onClick={() => onNavigate('settings')}
            title={t('header.settings')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              currentPage === 'settings'
                ? 'bg-white/20 dark:bg-white/10 text-foreground'
                : 'text-foreground/60 hover:bg-white/15 dark:hover:bg-white/8 hover:text-foreground'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="group relative z-20 glass-subtle border-r flex flex-col w-60 transition-all duration-300 ease-liquid">
      {isMac && !isFullscreen && (
        <div className="h-12 titlebar-drag shrink-0 flex items-center pl-3" data-tauri-drag-region>
          <TrafficLights />
        </div>
      )}

      <div className="absolute top-1/2 -translate-y-1/2 -right-3 z-50 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
        <button
          onClick={toggleCollapsed}
          className="h-12 w-7 rounded-full border border-border bg-background shadow-sm hover:shadow-md hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-all duration-200"
          title={t('common.collapse', '收起')}
        >
          <ChevronLeftIcon className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-hide">
        <NavModule
          id="prompts"
          icon={<MessageSquareTextIcon className="w-5 h-5" />}
          label={t('common.prompts')}
          count={promptCount}
        >
          <PromptNavSection currentPage={currentPage} onNavigate={onNavigate} />
        </NavModule>

        <NavModule
          id="skills"
          icon={<WrenchIcon className="w-5 h-5" />}
          label={t('common.skills')}
          count={skillCount}
        >
          <SkillNavSection currentPage={currentPage} onNavigate={onNavigate} />
        </NavModule>
      </nav>

      <TagCloudPanel />

      <div className="p-2 border-t border-white/10 dark:border-white/5 space-y-1">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentPage === 'settings'
              ? 'bg-white/20 dark:bg-white/10 text-foreground'
              : 'text-foreground/60 hover:bg-white/15 dark:hover:bg-white/8 hover:text-foreground'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>{t('header.settings')}</span>
        </button>
      </div>
    </aside>
  );
}
