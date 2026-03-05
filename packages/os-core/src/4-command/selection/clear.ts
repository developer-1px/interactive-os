import { produce } from "immer";
import { os } from "../../engine/kernel";
import { ensureZone } from "../../schema/state/utils";

/**
 * OS_SELECTION_CLEAR — Clear selection
 *
 * The only selection primitive needed at OS level.
 * All other selection operations go through OS_SELECT(mode: "toggle"|"range"|"single"|"replace").
 */
export const OS_SELECTION_CLEAR = os.defineCommand(
  "OS_SELECTION_CLEAR",
  (ctx) => (payload: { zoneId: string }) => ({
    state: produce(ctx.state, (draft) => {
      const zone = ensureZone(draft.os, payload.zoneId);
      for (const id of Object.keys(zone.items)) {
        if (zone.items[id]?.["aria-selected"]) {
          zone.items[id] = { ...zone.items[id], "aria-selected": false };
        }
      }
      zone.selectionAnchor = null;
    }) as typeof ctx.state,
  }),
);
