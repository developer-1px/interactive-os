/**
 * OS_SELECT Command — aria-selected state management (kernel version)
 *
 * Supports single, toggle, range, and replace modes.
 * After selection changes, dispatches onSelect callback if registered.
 * For aria-checked toggling, use OS_CHECK instead.
 */

import { produce } from "immer";
import { DOM_EXPANDABLE_ITEMS, DOM_ITEMS, ZONE_CONFIG } from "../../2-contexts";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";
import { ensureZone } from "../../state/utils";
import { buildZoneCursor } from "../utils/buildZoneCursor";
import { OS_EXPAND } from "../expand";

interface SelectPayload {
  targetId?: string;
  mode?: "single" | "replace" | "toggle" | "range";
}

export const OS_SELECT = os.defineCommand(
  "OS_SELECT",
  [DOM_ITEMS, ZONE_CONFIG],
  (ctx) => (payload: SelectPayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const targetId = payload.targetId ?? zone.focusedItemId;
    if (!targetId) return;

    // APG: disabled items cannot be selected
    if (ZoneRegistry.isDisabled(activeZoneId, targetId)) return;

    // W3C APG: Space toggles selection, Enter activates.
    // Ensure we process selection rather than expanding, as expansion belongs in OS_ACTIVATE.

    // DOM_ITEMS provider decides the source (browser/headless+React/pure headless)
    const items: string[] = ctx.inject(DOM_ITEMS);
    // zoneEntry still needed for onSelect callback
    const zoneEntry = ZoneRegistry.get(activeZoneId);
    const mode = payload.mode ?? "single";

    const result = {
      state: produce(ctx.state, (draft) => {
        const z = ensureZone(draft.os, activeZoneId);

        switch (mode) {
          case "single":
          case "replace":
            z.selection = [targetId];
            z.selectionAnchor = targetId;
            break;

          case "toggle":
            if (z.selection.includes(targetId)) {
              z.selection = z.selection.filter((id: string) => id !== targetId);
            } else {
              z.selection.push(targetId);
              z.selectionAnchor = targetId;
            }
            break;

          case "range": {
            const anchor = z.selectionAnchor ?? targetId;
            const anchorIdx = items.indexOf(anchor);
            const targetIdx = items.indexOf(targetId);
            if (anchorIdx !== -1 && targetIdx !== -1) {
              const start = Math.min(anchorIdx, targetIdx);
              const end = Math.max(anchorIdx, targetIdx);
              z.selection = items.slice(start, end + 1);
              z.selectionAnchor = anchor;
            }
            break;
          }
        }
      }) as typeof ctx.state,
    };

    // Dispatch onSelect callback if registered
    if (zoneEntry?.onSelect) {
      const updatedZone = result.state.os.focus.zones[activeZoneId];
      const cursor = buildZoneCursor(updatedZone);
      if (cursor) {
        return {
          ...result,
          dispatch: zoneEntry.onSelect(cursor),
        };
      }
    }

    return result;
  },
);
