/**
 * FIELD Commands — Kernel-based field editing (replaces FieldRegistry).
 *
 * State: ZoneState.editingItemId, ZoneState.fieldEvent
 *
 * Commands:
 *   FIELD_START_EDIT — Enter editing mode on the focused item
 *   FIELD_COMMIT    — Exit editing mode and commit the value
 *   FIELD_CANCEL    — Exit editing mode and discard changes
 */

import { produce } from "immer";
import { kernel } from "../kernel";

// ═══════════════════════════════════════════════════════════════════
// FIELD_START_EDIT
// ═══════════════════════════════════════════════════════════════════

export const FIELD_START_EDIT = kernel.defineCommand(
  "FIELD_START_EDIT",
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone?.focusedItemId) return;

    // Already editing this item — no-op
    if (zone.editingItemId === zone.focusedItemId) return;

    return {
      state: produce(ctx.state, (draft) => {
        const z = draft.os.focus.zones[activeZoneId];
        if (z) {
          z.editingItemId = z.focusedItemId;
          z.fieldEvent = null; // Clear any pending event
        }
      }) as typeof ctx.state,
    };
  },
);

// ═══════════════════════════════════════════════════════════════════
// FIELD_COMMIT
// ═══════════════════════════════════════════════════════════════════

export const FIELD_COMMIT = kernel.defineCommand(
  "FIELD_COMMIT",
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone?.editingItemId) return;

    const editingId = zone.editingItemId;

    return {
      state: produce(ctx.state, (draft) => {
        const z = draft.os.focus.zones[activeZoneId];
        if (z) {
          z.editingItemId = null;
          z.fieldEvent = {
            type: "commit",
            id: editingId,
            tick: Date.now(),
          };
        }
      }) as typeof ctx.state,
    };
  },
);

// ═══════════════════════════════════════════════════════════════════
// FIELD_CANCEL
// ═══════════════════════════════════════════════════════════════════

export const FIELD_CANCEL = kernel.defineCommand(
  "FIELD_CANCEL",
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone?.editingItemId) return;

    const editingId = zone.editingItemId;

    return {
      state: produce(ctx.state, (draft) => {
        const z = draft.os.focus.zones[activeZoneId];
        if (z) {
          z.editingItemId = null;
          z.fieldEvent = {
            type: "cancel",
            id: editingId,
            tick: Date.now(),
          };
        }
      }) as typeof ctx.state,
    };
  },
);
