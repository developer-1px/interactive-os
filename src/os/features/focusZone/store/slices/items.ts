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
        console.log(`[ItemsSlice] addItem ${itemId}`, { count: state.items.length + 1, storeId: state.debugId });
        return {
            items: state.items.includes(itemId)
                ? state.items
                : [...state.items, itemId],
        }
    }),

    removeItem: (itemId) => set((state: any) => {
        console.log(`[ItemsSlice] removeItem ${itemId}`, { remaining: state.items.length - 1 });
        const newItems = state.items.filter((id: string) => id !== itemId);
        const updates: Record<string, any> = { items: newItems };

        // Focus recovery: if removed item was focused, move to next/prev
        if (state.focusedItemId === itemId) {
            const removedIndex = state.items.indexOf(itemId);
            const nextItem = newItems[removedIndex] || newItems[removedIndex - 1] || null;
            updates.focusedItemId = nextItem;
            if (nextItem) updates.lastFocusedId = nextItem;
        }

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
