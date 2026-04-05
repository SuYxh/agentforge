import { useEffect, useState, lazy, Suspense } from "react";
import { NavigationRail, TopBar, MainContent, TitleBar } from "@/components/layout";
import { usePromptStore } from "@/stores/prompt.store";
import { useFolderStore } from "@/stores/folder.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useToast } from "@/components/ui/Toast";
import { DndContext, DragEndEvent, pointerWithin } from "@dnd-kit/core";
import i18n from "@/i18n";
import { seedDatabase } from "@/services/seedData";
import { useWebDAVSync } from "@/hooks/useWebDAVSync";

const SettingsPage = lazy(() =>
  import("@/components/settings/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);

type PageType = "home" | "settings";

function App() {
  const fetchPrompts = usePromptStore((state) => state.fetchPrompts);
  const fetchFolders = useFolderStore((state) => state.fetchFolders);
  const folders = useFolderStore((state) => state.folders);
  const movePrompts = usePromptStore((state) => state.movePrompts);
  const selectedIds = usePromptStore((state) => state.selectedIds);
  const applyTheme = useSettingsStore((state) => state.applyTheme);
  const shortcutModes = useSettingsStore((state) => state.shortcutModes);
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useWebDAVSync();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const parts: string[] = [];
      const isMac = navigator.userAgent.toLowerCase().includes("mac");

      if (isMac ? e.metaKey : e.ctrlKey) parts.push("CommandOrControl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      let key = e.key;
      if (["Control", "Alt", "Shift", "Meta"].includes(key)) return;

      if (key === " ") key = "Space";
      parts.push(key.toUpperCase());

      const pressed = parts.join("+");

      const defaultShortcuts: Record<string, string> = {
        newPrompt: "CommandOrControl+N",
        search: "CommandOrControl+F",
        settings: "CommandOrControl+,",
      };

      for (const [action, accelerator] of Object.entries(defaultShortcuts)) {
        if (accelerator === pressed) {
          const mode = (shortcutModes && shortcutModes[action]) || "local";
          if (mode === "local") {
            e.preventDefault();
            switch (action) {
              case "newPrompt":
                window.dispatchEvent(new CustomEvent("shortcut:newPrompt"));
                break;
              case "search":
                window.dispatchEvent(new CustomEvent("shortcut:search"));
                break;
              case "settings":
                setCurrentPage("settings");
                break;
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutModes]);

  useEffect(() => {
    applyTheme();

    const languageSettings = useSettingsStore.getState();
    if (
      languageSettings.language &&
      i18n.language !== languageSettings.language
    ) {
      languageSettings.setLanguage(languageSettings.language);
    }

    const init = async () => {
      const maxLoadingTime = setTimeout(() => {
        console.warn("Loading timeout, showing UI anyway");
        setIsLoading(false);
      }, 5000);

      try {
        await seedDatabase(i18n.language);
        await fetchPrompts();
        await fetchFolders();
        console.log("App initialized");
      } catch (error) {
        console.error("Init failed:", error);
      } finally {
        clearTimeout(maxLoadingTime);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (
      activeData?.type === "prompt" &&
      (overData?.type === "folder" || overData?.type === "folder-nest")
    ) {
      const promptId = activeData.prompt.id;
      const folderId = overData.folderId;
      const folder = folders.find((f) => f.id === folderId);

      let promptsToMove = [promptId];

      if (selectedIds.includes(promptId)) {
        promptsToMove = selectedIds;
      }

      await movePrompts(promptsToMove, folderId);

      const count = promptsToMove.length;
      showToast(
        count > 1
          ? `已将 ${count} 个 Prompt 移动到「${folder?.name || "文件夹"}」`
          : `已移动到「${folder?.name || "文件夹"}」`,
        "success",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background rounded-xl overflow-hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
      <div className="flex flex-col h-screen text-foreground overflow-hidden liquid-bg relative rounded-xl">
        <TitleBar />

        <div className="light-orb light-orb-primary absolute -top-48 -right-48" />
        <div className="light-orb light-orb-secondary absolute -bottom-32 -left-32" />

        <div className="flex flex-1 overflow-y-hidden overflow-x-visible">
          <NavigationRail currentPage={currentPage} onNavigate={setCurrentPage} />

          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar
              onOpenSettings={() => setCurrentPage("settings")}
            />

            {currentPage === "home" ? (
              <MainContent />
            ) : (
              <Suspense
                fallback={
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                <SettingsPage onBack={() => setCurrentPage("home")} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}

export default App;
