import { produce } from "immer";
import { kernel } from "../../kernel";
import { ensureZone } from "../../state/utils";

interface FocusPayload {
  zoneId: string;
  itemId: string | null;
}

export const FOCUS = kernel.defineCommand(
  "OS_FOCUS",
  (ctx) => (payload: FocusPayload) => {
    const { zoneId, itemId } = payload;
    return {
      state: produce(ctx.state, (draft) => {
        const zone = ensureZone(draft.os, zoneId);
        zone.focusedItemId = itemId;

        if (itemId) {
          zone.lastFocusedId = itemId;
          zone.recoveryTargetId = null;
          draft.os.focus.activeZoneId = zoneId;
        }
      }),

      // Effect: trigger DOM focus
      focus: itemId,
    };
  },
);
