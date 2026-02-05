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

// ═══════════════════════════════════════════════════════════════════
// Combined State Type
// ═══════════════════════════════════════════════════════════════════

export type FocusGroupState = CursorSlice & SpatialSlice & SelectionSlice & ItemsSlice & {
    zoneId: string;
};

// ═══════════════════════════════════════════════════════════════════
// Store Factory
// ═══════════════════════════════════════════════════════════════════

export type FocusGroupStore = ReturnType<typeof createFocusGroupStore>;

export function createFocusGroupStore(zoneId: string) {
    return create<FocusGroupState>()((...a) => ({
        zoneId,
        debugId: Math.random().toString(36).slice(2, 7),
        ...createCursorSlice(...a),
        ...createSpatialSlice(...a),
        ...createSelectionSlice(...a),
        ...createItemsSlice(...a),
    }));
}
