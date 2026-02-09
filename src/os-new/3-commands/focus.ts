import { produce } from "immer";
import { kernel } from "../kernel";
import { ensureZone } from "../state/utils";

export const FOCUS = kernel.defineCommand(
  "OS_FOCUS",
  (ctx) => (zoneId: string, itemId: string | null) => {
    return {
      state: produce(ctx.state, (draft) => {
        // 1. Ensure zone entry exists
        const zone = ensureZone(draft.os, zoneId);

        // 2. Update focus state
        // If focusing same item, no-op (optimization handled by kernel diff if state is same)
        // But we might want to force effects, so we proceed.

        zone.focusedItemId = itemId;

        if (itemId) {
          zone.lastFocusedId = itemId;
          zone.recoveryTargetId = null;

          // 3. Activate this zone locally (assuming focus implies activation)
          // The global activeZoneId might be handled by OS_ACTIVATE,
          // but typically focusing an item makes the zone active.
          draft.os.focus.activeZoneId = zoneId;
        }
      }),

      // Effect: trigger DOM focus
      // This key "focus" will be mapped to a defineEffect("focus") handler later.
      focus: itemId,
    };
  },
);
