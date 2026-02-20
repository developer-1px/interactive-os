/**
 * OS_EXPAND Command — Expand/collapse tree items (kernel version)
 *
 * Reuses the existing pure resolveExpansion function.
 */

import { produce } from "immer";
import { os } from "../../kernel";
import { ensureZone } from "../../state/utils";
import { type ExpandAction, resolveExpansion } from "./resolveExpansion";

interface ExpandPayload {
  itemId?: string;
  action?: ExpandAction;
  /** Explicit zone — use when dispatching outside normal focus flow (e.g. onClick) */
  zoneId?: string;
}

export const OS_EXPAND = os.defineCommand(
  "OS_EXPAND",
  (ctx) => (payload: ExpandPayload) => {
    const zoneId = payload.zoneId ?? ctx.state.os.focus.activeZoneId;
    if (!zoneId) return;

    const zone = ctx.state.os.focus.zones[zoneId];
    if (!zone) return;

    const targetId = payload.itemId ?? zone.focusedItemId;
    if (!targetId) return;

    const action = payload.action ?? "toggle";
    const result = resolveExpansion(zone.expandedItems, targetId, action);
    if (!result.changed) return;

    return {
      state: produce(ctx.state, (draft) => {
        const z = ensureZone(draft.os, zoneId);
        z.expandedItems = result.expandedItems;
      }),
    };
  },
);
