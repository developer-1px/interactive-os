import { produce } from "immer";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import { ensureZone } from "../../state/utils";

interface FocusPayload {
  zoneId: string;
  itemId: string | null;
}

export const FOCUS = kernel.defineCommand(
  "OS_FOCUS",
  (ctx) => (payload: FocusPayload) => {
    const { zoneId } = payload;
    let { itemId } = payload;

    // Check virtualFocus config from registry
    const zoneEntry = ZoneRegistry.get(zoneId);
    const isVirtual = zoneEntry?.config?.project?.virtualFocus ?? false;

    // Restore: if no explicit itemId, restore lastFocusedId (zone re-entry)
    if (!itemId) {
      const existingZone = ctx.state.os.focus.zones[zoneId];
      if (existingZone?.lastFocusedId) {
        itemId = existingZone.lastFocusedId;
      }
    }

    return {
      state: produce(ctx.state, (draft) => {
        const zone = ensureZone(draft.os, zoneId);
        zone.focusedItemId = itemId;

        // Always activate the zone (even zone-only click with null itemId)
        draft.os.focus.activeZoneId = zoneId;

        if (itemId) {
          zone.lastFocusedId = itemId;
          zone.recoveryTargetId = null;
        }
      }),

      // Effect: trigger DOM focus only if NOT virtual
      focus: isVirtual ? undefined : itemId,
    };
  },
);
