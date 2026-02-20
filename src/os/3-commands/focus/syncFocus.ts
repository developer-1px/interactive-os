/**
 * OS_SYNC_FOCUS Command — Synchronize OS state with DOM focus (kernel version)
 *
 * Triggered by 'focusin' event.
 * Updates state but DOES NOT trigger DOM focus (prevent loop).
 */

import { produce } from "immer";
import { os } from "../../kernel";
import { ensureZone } from "../../state/utils";

interface SyncFocusPayload {
  id: string;
  zoneId: string;
}

export const OS_SYNC_FOCUS = os.defineCommand(
  "OS_SYNC_FOCUS",
  (ctx) => (payload: SyncFocusPayload) => {
    return {
      state: produce(ctx.state, (draft) => {
        const z = ensureZone(draft.os, payload.zoneId);
        z.focusedItemId = payload.id;
        z.lastFocusedId = payload.id;
        draft.os.focus.activeZoneId = payload.zoneId;
      }),
      // NO focus effect — prevents loop
    };
  },
);
