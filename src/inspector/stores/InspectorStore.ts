/**
 * InspectorStore — Global Inspector UI state
 *
 * Manages open/close, active tab, panel expansion.
 * Persists to localStorage so state survives page reload.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface InspectorState {
    isOpen: boolean;
    activeTab: string;
    isPanelExpanded: boolean;
    setActiveTab: (tab: string) => void;
    togglePanel: () => void;
}

export const useInspectorStore = create<InspectorState>()(
    persist(
        (set) => ({
            isOpen: true,
            activeTab: "EVENTS",
            isPanelExpanded: false,
            setActiveTab: (tab: string) =>
                set((s) => ({
                    activeTab: tab,
                    isPanelExpanded: s.activeTab === tab ? !s.isPanelExpanded : true,
                })),
            togglePanel: () => set((s) => ({ isPanelExpanded: !s.isPanelExpanded })),
        }),
        {
            name: "inspector-ui",
            partialize: (state) => ({
                isOpen: state.isOpen,
                activeTab: state.activeTab,
                isPanelExpanded: state.isPanelExpanded,
            }),
        },
    ),
);

/** Static API for non-React contexts */
export const InspectorStore = {
    isOpen: () => useInspectorStore.getState().isOpen,

    toggle: () =>
        useInspectorStore.setState((s) => ({ isOpen: !s.isOpen })),

    setOpen: (open: boolean) =>
        useInspectorStore.setState({ isOpen: open }),

    setActiveTab: (tab: string) =>
        useInspectorStore.getState().setActiveTab(tab),

    setPanelExpanded: (expanded: boolean) =>
        useInspectorStore.setState({ isPanelExpanded: expanded }),
};
