import { produce } from "immer";
import { kernel } from "../../kernel";
import { ensureZone } from "../../state/utils";

/**
 * SELECTION Commands
 *
 * Manages the multi-selection state of a zone.
 */

// 1. SET: Replace current selection
export const SELECTION_SET = kernel.defineCommand(
  "OS_SELECTION_SET",
  (ctx) => (payload: { zoneId: string; ids: string[] }) => ({
    state: produce(ctx.state, (draft: any) => {
      const zone = ensureZone(draft.os, payload.zoneId);
      zone.selection = payload.ids;
      zone.selectionAnchor =
        payload.ids.length > 0
          ? (payload.ids[payload.ids.length - 1] ?? null)
          : null;
    }) as typeof ctx.state,
  }),
);

// 2. ADD: Add item to selection
export const SELECTION_ADD = kernel.defineCommand(
  "OS_SELECTION_ADD",
  (ctx) => (payload: { zoneId: string; id: string }) => ({
    state: produce(ctx.state, (draft: any) => {
      const zone = ensureZone(draft.os, payload.zoneId);
      if (!zone.selection.includes(payload.id)) {
        zone.selection.push(payload.id);
      }
      zone.selectionAnchor = payload.id;
    }) as typeof ctx.state,
  }),
);

// 3. REMOVE: Remove item from selection
export const SELECTION_REMOVE = kernel.defineCommand(
  "OS_SELECTION_REMOVE",
  (ctx) => (payload: { zoneId: string; id: string }) => ({
    state: produce(ctx.state, (draft: any) => {
      const zone = ensureZone(draft.os, payload.zoneId);
      zone.selection = zone.selection.filter((item) => item !== payload.id);
      if (zone.selectionAnchor === payload.id) {
        zone.selectionAnchor = null;
      }
    }) as typeof ctx.state,
  }),
);

// 4. TOGGLE: Toggle item in selection
export const SELECTION_TOGGLE = kernel.defineCommand(
  "OS_SELECTION_TOGGLE",
  (ctx) => (payload: { zoneId: string; id: string }) => ({
    state: produce(ctx.state, (draft: any) => {
      const zone = ensureZone(draft.os, payload.zoneId);
      if (zone.selection.includes(payload.id)) {
        zone.selection = zone.selection.filter((item) => item !== payload.id);
        if (zone.selectionAnchor === payload.id) zone.selectionAnchor = null;
      } else {
        zone.selection.push(payload.id);
        zone.selectionAnchor = payload.id;
      }
    }) as typeof ctx.state,
  }),
);

// 5. CLEAR: Clear selection
export const SELECTION_CLEAR = kernel.defineCommand(
  "OS_SELECTION_CLEAR",
  (ctx) => (payload: { zoneId: string }) => ({
    state: produce(ctx.state, (draft: any) => {
      const zone = ensureZone(draft.os, payload.zoneId);
      zone.selection = [];
      zone.selectionAnchor = null;
    }) as typeof ctx.state,
  }),
);
