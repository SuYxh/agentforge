import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NavigationState {
  activeModuleId: string;
  setActiveModule: (id: string) => void;
  expandedModules: Record<string, boolean>;
  toggleModuleExpanded: (id: string) => void;
  setModuleExpanded: (id: string, expanded: boolean) => void;
  isRailCollapsed: boolean;
  toggleRailCollapsed: () => void;
  setRailCollapsed: (collapsed: boolean) => void;
  isTagPanelCollapsed: boolean;
  toggleTagPanelCollapsed: () => void;
  setTagPanelCollapsed: (collapsed: boolean) => void;
  tagPanelHeight: number;
  setTagPanelHeight: (h: number) => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      activeModuleId: "prompts",
      setActiveModule: (id) =>
        set((state) => ({
          activeModuleId: id,
          expandedModules: { ...state.expandedModules, [id]: true },
        })),
      expandedModules: { prompts: true },
      toggleModuleExpanded: (id) =>
        set((state) => ({
          expandedModules: {
            ...state.expandedModules,
            [id]: !state.expandedModules[id],
          },
        })),
      setModuleExpanded: (id, expanded) =>
        set((state) => ({
          expandedModules: { ...state.expandedModules, [id]: expanded },
        })),
      isRailCollapsed: false,
      toggleRailCollapsed: () =>
        set((state) => ({ isRailCollapsed: !state.isRailCollapsed })),
      setRailCollapsed: (collapsed) => set({ isRailCollapsed: collapsed }),
      isTagPanelCollapsed: false,
      toggleTagPanelCollapsed: () =>
        set((state) => ({ isTagPanelCollapsed: !state.isTagPanelCollapsed })),
      setTagPanelCollapsed: (collapsed) =>
        set({ isTagPanelCollapsed: collapsed }),
      tagPanelHeight: 140,
      setTagPanelHeight: (h) => set({ tagPanelHeight: h }),
    }),
    {
      name: "navigation-storage",
      partialize: (state) => ({
        isRailCollapsed: state.isRailCollapsed,
        expandedModules: state.expandedModules,
        isTagPanelCollapsed: state.isTagPanelCollapsed,
        tagPanelHeight: state.tagPanelHeight,
      }),
    },
  ),
);
