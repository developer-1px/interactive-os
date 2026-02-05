/**
 * Selection Slice
 * 
 * Selection 상태 관리 (Focus와 독립)
 * - selection: 현재 선택된 아이템 ID 배열
 * - selectionAnchor: Range 선택 기준점
 */

import type { StateCreator } from "zustand";

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
    // Initial State
    selection: [],
    selectionAnchor: null,

    // Actions
    setSelection: (ids) => set({ selection: ids }),

    addToSelection: (id) => set((state) => ({
        selection: state.selection.includes(id)
            ? state.selection
            : [...state.selection, id]
    })),

    removeFromSelection: (id) => set((state) => ({
        selection: state.selection.filter((i) => i !== id)
    })),

    toggleSelection: (id) => set((state) => ({
        selection: state.selection.includes(id)
            ? state.selection.filter((i) => i !== id)
            : [...state.selection, id]
    })),

    setSelectionAnchor: (id) => set({ selectionAnchor: id }),

    clearSelection: () => set({ selection: [], selectionAnchor: null }),
});
