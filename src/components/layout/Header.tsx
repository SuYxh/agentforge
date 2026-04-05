import { SearchIcon, PlusIcon, SettingsIcon, SunIcon, MoonIcon } from 'lucide-react';
import { usePromptStore } from '@/stores/prompt.store';
import { useState, useEffect } from 'react';
import { CreatePromptModal } from '@/components/prompt/CreatePromptModal';
import { SettingsModal } from '@/components/settings/SettingsModal';

export function Header() {
  const searchQuery = usePromptStore((state) => state.searchQuery);
  const setSearchQuery = usePromptStore((state) => state.setSearchQuery);
  const [isDark, setIsDark] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleCreatePrompt = (data: {
    title: string;
    description?: string;
    systemPrompt?: string;
    userPrompt: string;
    tags: string[];
  }) => {
    console.log('Creating prompt:', data);
  };

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(darkModeMediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    darkModeMediaQuery.addEventListener('change', handler);
    return () => darkModeMediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <header className="h-14 glass border-b flex items-center gap-4 px-5 titlebar-drag sticky top-0 z-10">
      <div className="flex-1 max-w-lg titlebar-no-drag">
        <div className="relative group">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="搜索 Prompt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full h-10 pl-10 pr-4 rounded-xl
              bg-white/20 dark:bg-white/8 border border-white/15 dark:border-white/8 backdrop-blur-sm
              text-sm placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background
              transition-all duration-200
            "
          />
        </div>
      </div>

      <div className="flex items-center gap-2 titlebar-no-drag">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="
            flex items-center gap-2 h-9 px-4 rounded-lg
            bg-primary text-white text-sm font-medium
            hover:bg-primary/90
            transition-colors duration-150
          "
        >
          <PlusIcon className="w-4 h-4" />
          <span>新建</span>
        </button>

        <button
          onClick={() => setIsDark(!isDark)}
          className="
            p-2 rounded-lg
            text-muted-foreground hover:text-foreground
            hover:bg-accent
            transition-colors duration-150
          "
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="
            p-2 rounded-lg
            text-muted-foreground hover:text-foreground
            hover:bg-accent
            transition-colors duration-150
          "
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      <CreatePromptModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePrompt}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </header>
  );
}
