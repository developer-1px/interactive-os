/**
 * FocusZone Store Factory
 * 
 * Creates scoped store instances for each FocusZone.
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

export type FocusZoneState = CursorSlice & SpatialSlice & SelectionSlice & ItemsSlice & {
    zoneId: string;
};

// ═══════════════════════════════════════════════════════════════════
// Store Factory
// ═══════════════════════════════════════════════════════════════════

export type FocusZoneStore = ReturnType<typeof createFocusZoneStore>;

export function createFocusZoneStore(zoneId: string) {
    return create<FocusZoneState>()((...a) => ({
        zoneId,
        debugId: Math.random().toString(36).slice(2, 7),
        ...createCursorSlice(...a),
        ...createSpatialSlice(...a),
        ...createSelectionSlice(...a),
        ...createItemsSlice(...a),
    }));
}
