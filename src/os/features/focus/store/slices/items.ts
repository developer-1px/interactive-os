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

        // NOTE: We intentionally do NOT change focusedItemId here.
        // React re-renders can cause temporary unmount/remount cycles.
        // If the item is actually gone, FocusSync will handle the stale focus
        // when it tries to focus a non-existent element.

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
