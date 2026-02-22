import { produce } from "immer";
import { os } from "../../kernel";
import { ensureZone } from "../../state/utils";

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
      zone.selection = [];
      zone.selectionAnchor = null;
    }) as typeof ctx.state,
  }),
);
