/**
 * OS_EXPAND Command — Expand/collapse tree items (kernel version)
 *
 * Reuses the existing pure resolveExpansion function.
 */

import { produce } from "immer";
import {
  type ExpandAction,
  resolveExpansion,
} from "./resolveExpansion";
import { kernel } from "../../kernel";
import { ensureZone } from "../../state/utils";

interface ExpandPayload {
  itemId?: string;
  action?: ExpandAction;
}

export const EXPAND = kernel.defineCommand(
  "OS_EXPAND",
  (ctx) => (payload: ExpandPayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const targetId = payload.itemId ?? zone.focusedItemId;
    if (!targetId) return;

    const action = payload.action ?? "toggle";
    const result = resolveExpansion(zone.expandedItems, targetId, action);
    if (!result.changed) return;

    return {
      state: produce(ctx.state, (draft) => {
        const z = ensureZone(draft.os, activeZoneId);
        z.expandedItems = result.expandedItems;
      }),
    };
  },
);
