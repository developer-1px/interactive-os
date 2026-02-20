import { produce } from "immer";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";
import { applyFollowFocus, ensureZone } from "../../state/utils";

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
        zone.recoveryTargetId = null;

        // Selection: explicit override > followFocus
        if (!payload.skipSelection) {
          if (payload.selection) {
            zone.selection = payload.selection;
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
