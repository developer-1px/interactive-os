/**
 * OS_SELECT_ALL Command — Cmd+A select all items
 *
 * Selects all visible items in the active zone.
 * Uses DOM_ITEMS to get the list of all item IDs in the zone.
 */

import { produce } from "immer";
import { DOM_ITEMS } from "../../2-contexts";
import { os } from "../../kernel";
import { ensureZone } from "../../state/utils";

export const OS_SELECT_ALL = os.defineCommand(
  "OS_SELECT_ALL",
  [DOM_ITEMS],
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    // DOM_ITEMS provider decides the source (browser/headless+React/pure headless)
    const items: string[] = ctx.inject(DOM_ITEMS);
    if (items.length === 0) return;

    return {
      state: produce(ctx.state, (draft) => {
        const zone = ensureZone(draft.os, activeZoneId);
        zone.selection = [...items];
        zone.selectionAnchor = items[0] ?? null;
      }) as typeof ctx.state,
    };
  },
);
