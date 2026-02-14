/**
 * OS_SELECT Command — aria-selected state management (kernel version)
 *
 * Supports single, toggle, range, and replace modes.
 * Pure selection only — does NOT trigger app callbacks.
 * For aria-checked toggling, use OS_CHECK instead.
 */

import { produce } from "immer";
import { DOM_ITEMS, ZONE_CONFIG } from "../../2-contexts";
import { kernel } from "../../kernel";
import { ensureZone } from "../../state/utils";
import { EXPAND } from "../expand";

interface SelectPayload {
  targetId?: string;
  mode?: "single" | "replace" | "toggle" | "range";
}

export const SELECT = kernel.defineCommand(
  "OS_SELECT",
  [DOM_ITEMS, ZONE_CONFIG],
  (ctx) => (payload: SelectPayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const targetId = payload.targetId ?? zone.focusedItemId;
    if (!targetId) return;

    // W3C Tree Pattern: Space toggles expansion for expandable items
    // Only applies for keyboard-triggered SELECT (no explicit targetId)
    if (!payload.targetId) {
      const targetEl = document.getElementById(targetId);
      if (targetEl?.hasAttribute("aria-expanded")) {
        return {
          dispatch: EXPAND({ action: "toggle", itemId: targetId }),
        };
      }
    }


    const items: string[] = ctx.inject(DOM_ITEMS);
    const mode = payload.mode ?? "single";

    return {
      state: produce(ctx.state, (draft: any) => {
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
  },
);
