/**
 * Expansion Slice - Manages expanded/collapsed state for tree/accordion items
 */

import type { StateCreator } from 'zustand';

export interface ExpansionSlice {
    /** Set of expanded item IDs */
    expandedItems: string[];

    /** Toggle expansion state of an item */
    toggleExpanded: (id: string) => void;

    /** Set expansion state explicitly */
    setExpanded: (id: string, expanded: boolean) => void;

    /** Check if an item is expanded */
    isExpanded: (id: string) => boolean;
}

export const createExpansionSlice: StateCreator<ExpansionSlice, [], [], ExpansionSlice> = (set, get) => ({
    expandedItems: [],

    toggleExpanded: (id) => set((state) => {
        const isCurrentlyExpanded = state.expandedItems.includes(id);
        return {
            expandedItems: isCurrentlyExpanded
                ? state.expandedItems.filter(i => i !== id)
                : [...state.expandedItems, id]
        };
    }),

    setExpanded: (id, expanded) => set((state) => {
        const isCurrentlyExpanded = state.expandedItems.includes(id);
        if (expanded && !isCurrentlyExpanded) {
            return { expandedItems: [...state.expandedItems, id] };
        }
        if (!expanded && isCurrentlyExpanded) {
            return { expandedItems: state.expandedItems.filter(i => i !== id) };
        }
        return state;
    }),

    isExpanded: (id) => get().expandedItems.includes(id),
});
