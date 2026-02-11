/**
 * OS_RECOVER Command — Focus Recovery (kernel version)
 *
 * Executed when focus is lost (document.body).
 * Uses pre-computed recoveryTargetId from state.
 */

import { produce } from "immer";
import { DOM_ITEMS } from "../2-contexts";
import { kernel } from "../kernel";
import { ensureZone } from "../state/utils";


export const RECOVER = kernel.defineCommand(
  "OS_RECOVER",
  [DOM_ITEMS],
  (ctx) => () => {

    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const items: string[] = ctx.inject(DOM_ITEMS);

    // 1. If focused item still exists in DOM, just re-focus it
    if (zone.focusedItemId && items.includes(zone.focusedItemId)) {
      return {
        focus: zone.focusedItemId,
      };
    }

    // 2. Use pre-computed recovery target from state
    const recoveryId = zone.recoveryTargetId;

    // 3. Verify recovery target exists in current DOM, fallback to first item
    const targetId =
      recoveryId && items.includes(recoveryId)
        ? recoveryId
        : (items[0] ?? null);

    if (!targetId) return;

    return {
      state: produce(ctx.state, (draft: any) => {
        const z = ensureZone(draft.os, activeZoneId);
        z.focusedItemId = targetId;
        z.lastFocusedId = targetId;
      }) as typeof ctx.state,
      focus: targetId,
    };
  },
);
