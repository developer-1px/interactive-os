import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { produce } from "immer";
import { os } from "../../engine/kernel";
import { applyFollowFocus, ensureZone } from "../../schema/state/utils";

interface FocusPayload {
  zoneId: string;
  itemId: string | null;
  /** Override selection (e.g., paste selects all new items) */
  selection?: string[];
  /** Skip selection processing completely (useful when chaining OS_SELECT) */
  skipSelection?: boolean;
}

export const focusHandler = (ctx: any) => (payload: FocusPayload) => {
  const { zoneId } = payload;
  let { itemId } = payload;

  const zoneEntry = ZoneRegistry.get(zoneId);

  // Restore: if no explicit itemId, restore lastFocusedId (zone re-entry)
  if (!itemId) {
    const existingZone = ctx.state.os.focus.zones[zoneId];
    if (existingZone?.lastFocusedId) {
      itemId = existingZone.lastFocusedId;
    }
  }

  return {
    state: produce(ctx.state, (draft: any) => {
      const zone = ensureZone(draft.os, zoneId);
      zone.focusedItemId = itemId;

      // Always activate the zone (even zone-only click with null itemId)
      draft.os.focus.activeZoneId = zoneId;

      if (itemId) {
        zone.lastFocusedId = itemId;

        // Selection: explicit override > followFocus
        if (!payload.skipSelection) {
          if (payload.selection) {
            // Clear existing selection
            for (const id of Object.keys(zone.items)) {
              if (zone.items[id]?.["aria-selected"]) {
                zone.items[id] = { ...zone.items[id], "aria-selected": false };
              }
            }
            // Apply new selection
            for (const id of payload.selection) {
              if (!zone.items[id]) zone.items[id] = {};
              zone.items[id] = { ...zone.items[id], "aria-selected": true };
            }
            zone.selectionAnchor = itemId;
          } else {
            applyFollowFocus(zone, itemId, zoneEntry?.config?.select);
          }
        }
      }
    }),
  };
};

export const OS_FOCUS = os.defineCommand("OS_FOCUS", focusHandler);
