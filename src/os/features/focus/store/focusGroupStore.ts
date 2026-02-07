/**
 * FocusGroup Store Factory
 *
 * Creates scoped store instances for each FocusGroup.
 * Each zone has isolated state - no global store pollution.
 *
 * Note: Items are tracked via DOM, not store (DOM is source of truth).
 */

import { create } from "zustand";
import { type CursorSlice, createCursorSlice } from "./slices/cursor";
import { createExpansionSlice, type ExpansionSlice } from "./slices/expansion";
import { createSelectionSlice, type SelectionSlice } from "./slices/selection";
import { createSpatialSlice, type SpatialSlice } from "./slices/spatial";

// ═══════════════════════════════════════════════════════════════════
// Combined State Type
// ═══════════════════════════════════════════════════════════════════

export type FocusGroupState = CursorSlice &
  SpatialSlice &
  SelectionSlice &
  ExpansionSlice & {
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
    ...createExpansionSlice(...a),
  }));
}
