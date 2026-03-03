/**
 * OS_INIT_SELECTION — Pre-select first item for disallowEmpty zones.
 *
 * Called by Zone on mount when select.disallowEmpty is true.
 * Unlike OS_SELECT, this command does NOT require activeZoneId —
 * it accepts an explicit zoneId parameter so it works at init time
 * before the zone has received focus.
 *
 * No-op if the zone already has a selection.
 */

import { produce } from "immer";
import { os } from "../../engine/kernel";

interface InitSelectionPayload {
  zoneId: string;
  itemId: string;
}

export const OS_INIT_SELECTION = os.defineCommand(
  "OS_INIT_SELECTION",
  (ctx) => (payload: InitSelectionPayload) => {
    const zone = ctx.state.os.focus.zones[payload.zoneId];
    if (!zone) return;

    // Already has selection — no-op
    if (zone.selection.length > 0) return;

    return {
      state: produce(ctx.state, (draft) => {
        const z = draft.os.focus.zones[payload.zoneId];
        if (z) {
          z.selection = [payload.itemId];
          z.selectionAnchor = payload.itemId;
        }
      }),
    };
  },
);
