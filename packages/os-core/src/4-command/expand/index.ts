/**
 * OS_EXPAND Command — Toggle aria-expanded state (kernel version)
 *
 * Writes items[id]["aria-expanded"] directly — command type IS the declaration.
 */

import { produce } from "immer";
import { os } from "../../engine/kernel";
import { ZoneRegistry } from "../../engine/registries/zoneRegistry";
import { ensureZone } from "../../schema/state/utils";
import type { ExpandAction } from "./resolveExpansion";

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

    // Guard: leaf items (not in expandable set) are silently skipped
    const expandableItems = ZoneRegistry.get(zoneId)?.getExpandableItems?.();
    if (expandableItems && !expandableItems.has(targetId)) return;

    const action = payload.action ?? "toggle";
    const currentlyExpanded = zone.items[targetId]?.["aria-expanded"] ?? false;

    let shouldBeExpanded: boolean;
    switch (action) {
      case "expand":
        shouldBeExpanded = true;
        break;
      case "collapse":
        shouldBeExpanded = false;
        break;
      default:
        shouldBeExpanded = !currentlyExpanded;
        break;
    }

    // No change needed
    if (shouldBeExpanded === currentlyExpanded) return;

    return {
      state: produce(ctx.state, (draft) => {
        const z = ensureZone(draft.os, zoneId);
        if (!z.items[targetId]) z.items[targetId] = {};
        z.items[targetId] = {
          ...z.items[targetId],
          "aria-expanded": shouldBeExpanded,
        };
      }),
    };
  },
);
