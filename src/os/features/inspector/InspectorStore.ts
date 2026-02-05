/**
 * Inspector Store - Global Zustand store for Inspector state
 * 
 * OS-level state, independent of any App.
 * OS commands can toggle this directly.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InspectorState {
    isOpen: boolean;
    toggle: () => void;
    setOpen: (isOpen: boolean) => void;
}

export const useInspectorStore = create<InspectorState>()(
    persist(
        (set) => ({
            isOpen: false,
            toggle: () => set((state) => ({ isOpen: !state.isOpen })),
            setOpen: (isOpen) => set({ isOpen }),
        }),
        {
            name: 'antigravity_inspector',
        }
    )
);

// Static accessor for non-React contexts (e.g., OS commands)
export const InspectorStore = {
    toggle: () => useInspectorStore.getState().toggle(),
    isOpen: () => useInspectorStore.getState().isOpen,
};
