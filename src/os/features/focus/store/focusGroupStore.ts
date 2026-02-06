/**
 * FocusGroup Store Factory
 * 
 * Creates scoped store instances for each FocusGroup.
 * Each zone has isolated state - no global store pollution.
 */

import { create } from 'zustand';
import { createCursorSlice, type CursorSlice } from './slices/cursor';
import { createSpatialSlice, type SpatialSlice } from './slices/spatial';
import { createSelectionSlice, type SelectionSlice } from './slices/selection';
import { createItemsSlice, type ItemsSlice } from './slices/items';
import { createExpansionSlice, type ExpansionSlice } from './slices/expansion';

// ═══════════════════════════════════════════════════════════════════
// Combined State Type
// ═══════════════════════════════════════════════════════════════════

export type FocusGroupState = CursorSlice & SpatialSlice & SelectionSlice & ItemsSlice & ExpansionSlice & {
    groupId: string;
};

// ═══════════════════════════════════════════════════════════════════
// Store Factory
// ═══════════════════════════════════════════════════════════════════

export type FocusGroupStore = ReturnType<typeof createFocusGroupStore>;

export function createFocusGroupStore(groupId: string) {
    return create<FocusGroupState>()((...a) => ({
        groupId,
        debugId: Math.random().toString(36).slice(2, 7),
        ...createCursorSlice(...a),
        ...createSpatialSlice(...a),
        ...createSelectionSlice(...a),
        ...createItemsSlice(...a),
        ...createExpansionSlice(...a),
    }));
}
