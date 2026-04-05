import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutGridIcon,
  StarIcon,
  GlobeIcon,
  Clock3Icon,
  StoreIcon,
  LinkIcon,
  PlusIcon,
} from 'lucide-react';
import { useSkillStore } from '@/stores/skill.store';
import { useNavigationStore } from '@/stores/navigation.store';
import { BUILTIN_SKILL_REGISTRY } from '@/constants/skill-registry';
import { NavLink } from './NavLink';
import { NavDivider } from './NavDivider';

interface SkillNavSectionProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function SkillNavSection({ currentPage, onNavigate }: SkillNavSectionProps) {
  const { t } = useTranslation();
  const isActive = useNavigationStore((s) => s.activeModuleId === 'skills');
  const setActiveModule = useNavigationStore((s) => s.setActiveModule);
  const skills = useSkillStore((s) => s.skills);
  const storeView = useSkillStore((s) => s.storeView);
  const setStoreView = useSkillStore((s) => s.setStoreView);
  const skillFilterType = useSkillStore((s) => s.filterType);
  const setSkillFilterType = useSkillStore((s) => s.setFilterType);
  const selectSkill = useSkillStore((s) => s.selectSkill);
  const selectedStoreSourceId = useSkillStore((s) => s.selectedStoreSourceId);
  const selectStoreSource = useSkillStore((s) => s.selectStoreSource);
  const customStoreSources = useSkillStore((s) => s.customStoreSources);
  const remoteStoreEntries = useSkillStore((s) => s.remoteStoreEntries);
  const deployedSkillNames = useSkillStore((s) => s.deployedSkillNames);

  const favoriteCount = useMemo(() => skills.filter((s) => s.is_favorite).length, [skills]);
  const skillDeployedCount = useMemo(
    () => skills.filter((s) => deployedSkillNames.has(s.name)).length,
    [skills, deployedSkillNames],
  );
  const skillPendingCount = useMemo(
    () => skills.filter((s) => !deployedSkillNames.has(s.name)).length,
    [skills, deployedSkillNames],
  );
  const claudeCodeStoreCount = useMemo(
    () => remoteStoreEntries['claude-code']?.skills.length || 0,
    [remoteStoreEntries],
  );

  const confirmLeaveDirtySkillEditor = useCallback(() => {
    const hasUnsaved = (
      window as Window & { __AGENTFORGE_SKILL_EDITOR_DIRTY?: boolean }
    ).__AGENTFORGE_SKILL_EDITOR_DIRTY;

    if (!hasUnsaved) {
      return true;
    }

    return window.confirm(
      t(
        'skill.unsavedChangesWarning',
        'You have unsaved changes. Discard and close?',
      ),
    );
  }, [t]);

  const nav = (action: () => void) => {
    if (!confirmLeaveDirtySkillEditor()) return;
    if (!isActive) setActiveModule('skills');
    action();
    if (currentPage !== 'home') onNavigate('home');
  };

  return (
    <div className="space-y-0.5">
      <NavLink
        icon={<LayoutGridIcon className="w-4 h-4" />}
        label={t('filter.all', '全部')}
        count={skills.length}
        active={isActive && skillFilterType === 'all' && storeView === 'my-skills' && currentPage === 'home'}
        onClick={() => nav(() => { setSkillFilterType('all'); setStoreView('my-skills'); selectSkill(null); })}
      />
      <NavLink
        icon={<StarIcon className="w-4 h-4" />}
        label={t('nav.favorites')}
        count={favoriteCount}
        active={isActive && skillFilterType === 'favorites' && storeView === 'my-skills' && currentPage === 'home'}
        onClick={() => nav(() => { setSkillFilterType('favorites'); setStoreView('my-skills'); selectSkill(null); })}
      />
      <NavLink
        icon={<GlobeIcon className="w-4 h-4" />}
        label={t('skill.deployed', '已分发')}
        count={skillDeployedCount}
        active={isActive && storeView === 'distribution' && currentPage === 'home'}
        onClick={() => nav(() => { setStoreView('distribution'); selectSkill(null); })}
      />
      <NavLink
        icon={<Clock3Icon className="w-4 h-4" />}
        label={t('skill.pendingDeployment', '待分发')}
        count={skillPendingCount}
        active={isActive && skillFilterType === 'pending' && storeView === 'my-skills' && currentPage === 'home'}
        onClick={() => nav(() => { setSkillFilterType('pending'); setStoreView('my-skills'); selectSkill(null); })}
      />

      <NavDivider />

      <NavLink
        icon={<StoreIcon className="w-4 h-4" />}
        label={t('nav.skillStore', 'Skill 商店')}
        active={false}
        onClick={() => nav(() => { setStoreView('store'); selectSkill(null); selectStoreSource(selectedStoreSourceId || 'official'); })}
      />

      {storeView === 'store' && (
        <div className="ml-3 pl-3 border-l border-white/10 dark:border-white/5 space-y-0.5">
          <button
            onClick={() => nav(() => { setStoreView('store'); selectStoreSource('official'); })}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
              isActive && selectedStoreSourceId === 'official'
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-foreground/60 hover:bg-white/10 dark:hover:bg-white/5 hover:text-foreground'
            }`}
          >
            <StoreIcon className="w-3.5 h-3.5" />
            <span className="flex-1 text-left truncate">{t('skill.officialStore', '官方商店')}</span>
            <span className="text-[10px] tabular-nums text-foreground/40">{BUILTIN_SKILL_REGISTRY.length}</span>
          </button>

          <button
            onClick={() => nav(() => { setStoreView('store'); selectStoreSource('claude-code'); })}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
              isActive && selectedStoreSourceId === 'claude-code'
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-foreground/60 hover:bg-white/10 dark:hover:bg-white/5 hover:text-foreground'
            }`}
          >
            <GlobeIcon className="w-3.5 h-3.5" />
            <span className="flex-1 text-left truncate">{t('skill.claudeCodeStore', 'Claude Code 商店')}</span>
            <span className="text-[10px] tabular-nums text-foreground/40">{claudeCodeStoreCount}</span>
          </button>

          {customStoreSources.map((source) => (
            <button
              key={source.id}
              onClick={() => nav(() => { setStoreView('store'); selectStoreSource(source.id); })}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                isActive && selectedStoreSourceId === source.id
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-foreground/60 hover:bg-white/10 dark:hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span className="flex-1 text-left truncate">{source.name}</span>
              {remoteStoreEntries[source.id]?.skills.length ? (
                <span className="text-[10px] tabular-nums text-foreground/40">
                  {remoteStoreEntries[source.id]?.skills.length}
                </span>
              ) : null}
              {!source.enabled && (
                <span className="text-[10px] text-foreground/40">{t('common.disabled', '停用')}</span>
              )}
            </button>
          ))}

          <button
            onClick={() => { selectStoreSource('new-custom'); if (currentPage !== 'home') onNavigate('home'); }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-dashed text-xs transition-colors ${
              selectedStoreSourceId === 'new-custom'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-white/15 dark:border-white/8 text-foreground/40 hover:border-primary/50 hover:text-foreground hover:bg-white/10 dark:hover:bg-white/5'
            }`}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span className="truncate">{t('skill.addStoreSource', '添加商店')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
