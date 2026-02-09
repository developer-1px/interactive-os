import { produce } from "immer";
import { kernel } from "../kernel";
import { ensureZone } from "../state/utils";

/**
 * SELECTION Commands
 *
 * Manages the multi-selection state of a zone.
 */

// 1. SET: Replace current selection
export const SELECTION_SET = kernel.defineCommand(
  "OS_SELECTION_SET",
  (ctx) => (zoneId: string, ids: string[]) => ({
    state: produce(ctx.state, (draft) => {
      const zone = ensureZone(draft.os, zoneId);
      zone.selection = ids;
      zone.selectionAnchor = ids.length > 0 ? ids[ids.length - 1] : null;
    }),
  }),
);

// 2. ADD: Add item to selection
export const SELECTION_ADD = kernel.defineCommand(
  "OS_SELECTION_ADD",
  (ctx) => (zoneId: string, id: string) => ({
    state: produce(ctx.state, (draft) => {
      const zone = ensureZone(draft.os, zoneId);
      if (!zone.selection.includes(id)) {
        zone.selection.push(id);
      }
      zone.selectionAnchor = id;
    }),
  }),
);

// 3. REMOVE: Remove item from selection
export const SELECTION_REMOVE = kernel.defineCommand(
  "OS_SELECTION_REMOVE",
  (ctx) => (zoneId: string, id: string) => ({
    state: produce(ctx.state, (draft) => {
      const zone = ensureZone(draft.os, zoneId);
      zone.selection = zone.selection.filter((item) => item !== id);
      if (zone.selectionAnchor === id) {
        zone.selectionAnchor = null;
      }
    }),
  }),
);

// 4. TOGGLE: Toggle item in selection
export const SELECTION_TOGGLE = kernel.defineCommand(
  "OS_SELECTION_TOGGLE",
  (ctx) => (zoneId: string, id: string) => ({
    state: produce(ctx.state, (draft) => {
      const zone = ensureZone(draft.os, zoneId);
      if (zone.selection.includes(id)) {
        zone.selection = zone.selection.filter((item) => item !== id);
        if (zone.selectionAnchor === id) zone.selectionAnchor = null;
      } else {
        zone.selection.push(id);
        zone.selectionAnchor = id;
      }
    }),
  }),
);

// 5. CLEAR: Clear selection
export const SELECTION_CLEAR = kernel.defineCommand(
  "OS_SELECTION_CLEAR",
  (ctx) => (zoneId: string) => ({
    state: produce(ctx.state, (draft) => {
      const zone = ensureZone(draft.os, zoneId);
      zone.selection = [];
      zone.selectionAnchor = null;
    }),
  }),
);
