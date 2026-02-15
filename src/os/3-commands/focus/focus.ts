import { produce } from "immer";
import { kernel } from "../../kernel";
import { ensureZone } from "../../state/utils";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";

interface FocusPayload {
  zoneId: string;
  itemId: string | null;
}

export const FOCUS = kernel.defineCommand(
  "OS_FOCUS",
  (ctx) => (payload: FocusPayload) => {
    const { zoneId, itemId } = payload;

    // Check virtualFocus config from registry
    // (Focus command doesn't inject config context directly)
    const zoneEntry = ZoneRegistry.get(zoneId);
    const isVirtual = zoneEntry?.config?.project?.virtualFocus ?? false;

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

      // Effect: trigger DOM focus only if NOT virtual
      focus: isVirtual ? undefined : itemId,
    };
  },
);
