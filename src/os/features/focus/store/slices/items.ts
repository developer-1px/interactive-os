/**
 * Items Slice - Zone item registry (logical, not DOM)
 */

import type { StateCreator } from 'zustand';

export interface ItemsSlice {
    // State
    items: string[];  // Ordered list of item IDs

    // Actions
    addItem: (itemId: string) => void;
    removeItem: (itemId: string) => void;
    setItems: (items: string[]) => void;
}

export const createItemsSlice: StateCreator<ItemsSlice> = (set) => ({
    items: [],

    addItem: (itemId) => set((state: any) => {
        return {
            items: state.items.includes(itemId)
                ? state.items
                : [...state.items, itemId],
        }
    }),

    removeItem: (itemId) => set((state: any) => {
        const newItems = state.items.filter((id: string) => id !== itemId);
        const updates: Record<string, any> = { items: newItems };

        // DEBUG: Comment out focus recovery
        // if (state.focusedItemId === itemId && newItems.length > 0) {
        //     const oldIndex = state.items.indexOf(itemId);
        //     // Prefer next item, fall back to previous
        //     const newIndex = Math.min(oldIndex, newItems.length - 1);
        //     updates.focusedItemId = newItems[newIndex];
        // } else if (state.focusedItemId === itemId) {
        //     updates.focusedItemId = null;
        // }

        // Selection cleanup: remove from selection if present
        if (state.selection?.includes(itemId)) {
            updates.selection = state.selection.filter((id: string) => id !== itemId);
            if (state.selectionAnchor === itemId) {
                updates.selectionAnchor = updates.selection[0] || null;
            }
        }

        return updates;
    }),

    setItems: (items) => set({ items }),
});
