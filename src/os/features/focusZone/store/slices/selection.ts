/**
 * Selection Slice - Multi-selection state
 */

import type { StateCreator } from 'zustand';

export interface SelectionSlice {
    // State
    selection: string[];
    selectionAnchor: string | null;

    // Actions
    setSelection: (ids: string[]) => void;
    addToSelection: (id: string) => void;
    removeFromSelection: (id: string) => void;
    toggleSelection: (id: string) => void;
    setSelectionAnchor: (id: string | null) => void;
    clearSelection: () => void;
}

export const createSelectionSlice: StateCreator<SelectionSlice> = (set) => ({
    selection: [],
    selectionAnchor: null,

    setSelection: (ids) => set({ selection: ids }),

    addToSelection: (id) => set((state) => ({
        selection: state.selection.includes(id)
            ? state.selection
            : [...state.selection, id],
    })),

    removeFromSelection: (id) => set((state) => ({
        selection: state.selection.filter((s) => s !== id),
    })),

    toggleSelection: (id) => set((state) => ({
        selection: state.selection.includes(id)
            ? state.selection.filter((s) => s !== id)
            : [...state.selection, id],
    })),

    setSelectionAnchor: (id) => set({ selectionAnchor: id }),

    clearSelection: () => set({ selection: [], selectionAnchor: null }),
});
