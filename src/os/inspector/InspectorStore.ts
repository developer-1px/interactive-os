/**
 * Inspector Store - Global Zustand store for Inspector state
 *
 * OS-level state, independent of any App.
 * OS commands can toggle this directly.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InspectorTab = string;

interface InspectorState {
  isOpen: boolean;
  activeTab: InspectorTab;
  isPanelExpanded: boolean;

  toggle: () => void;
  setOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: InspectorTab) => void;
  togglePanel: () => void;
  setPanelExpanded: (isExpanded: boolean) => void;
}

export const useInspectorStore = create<InspectorState>()(
  persist(
    (set) => ({
      isOpen: false,
      activeTab: "STATE",
      isPanelExpanded: true,

      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (isOpen) => set({ isOpen }),
      setActiveTab: (tab) =>
        set((state) => {
          if (state.activeTab === tab) {
            // Toggle panel if clicking same tab
            return { isPanelExpanded: !state.isPanelExpanded };
          }
          // Switch tab and ensure panel is open
          return { activeTab: tab, isPanelExpanded: true };
        }),
      togglePanel: () =>
        set((state) => ({ isPanelExpanded: !state.isPanelExpanded })),
      setPanelExpanded: (isExpanded) => set({ isPanelExpanded: isExpanded }),
    }),
    {
      name: "antigravity_inspector",
    },
  ),
);

// Static accessor for non-React contexts (e.g., OS commands)
export const InspectorStore = {
  toggle: () => useInspectorStore.getState().toggle(),
  isOpen: () => useInspectorStore.getState().isOpen,
  setOpen: (isOpen: boolean) => useInspectorStore.getState().setOpen(isOpen),
  setActiveTab: (tab: InspectorTab) =>
    useInspectorStore.getState().setActiveTab(tab),
  togglePanel: () => useInspectorStore.getState().togglePanel(),
  setPanelExpanded: (isExpanded: boolean) =>
    useInspectorStore.getState().setPanelExpanded(isExpanded),
};
