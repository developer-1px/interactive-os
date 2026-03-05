/**
 * OS_ESCAPE Command — Escape key handling (kernel version)
 *
 * Behavior determined by Zone's dismiss config:
 * - "deselect": Clear current selection
 * - "close": Blur/close the zone
 * - "none": No action
 *
 * The `force` payload overrides dismiss config — always deselects.
 * Used by app keybindings (e.g., drillUp terminal case) that need
 * guaranteed deselect regardless of zone dismiss setting.
 */

import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { produce } from "immer";
import { os } from "../../engine/kernel";
import { ensureZone } from "../../schema/state/utils";

/** Helper: check if zone has any selected items */
function hasSelection(zone: {
  items: Record<string, { "aria-selected"?: boolean }>;
}): boolean {
  for (const id in zone.items) {
    if (zone.items[id]?.["aria-selected"]) return true;
  }
  return false;
}

/** Helper: clear all aria-selected */
function clearSelected(z: {
  items: Record<string, { "aria-selected"?: boolean }>;
}) {
  for (const id of Object.keys(z.items)) {
    if (z.items[id]?.["aria-selected"]) {
      z.items[id] = { ...z.items[id], "aria-selected": false };
    }
  }
}

export const OS_ESCAPE = os.defineCommand(
  "OS_ESCAPE",
  (ctx) => (payload: { force?: boolean }) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const zoneEntry = ZoneRegistry.get(activeZoneId);
    if (!zoneEntry) return;

    const config = zoneEntry.config;
    const dismissMode = payload?.force ? "deselect" : config.dismiss?.escape;

    switch (dismissMode) {
      case "deselect": {
        if (!hasSelection(zone) && !payload?.force) return;
        return {
          state: produce(ctx.state, (draft) => {
            const z = ensureZone(draft.os, activeZoneId);
            clearSelected(z);
            z.selectionAnchor = null;
            // Only clear focus on force deselect (zone deactivation).
            // Normal Escape keeps focus on current item.
            if (payload?.force) {
              z.focusedItemId = null;
              draft.os.focus.activeZoneId = null;
            }
          }) as typeof ctx.state,
        };
      }
      case "close": {
        const dismissCommand = zoneEntry?.onDismiss;

        return {
          state: produce(ctx.state, (draft) => {
            const z = ensureZone(draft.os, activeZoneId);
            z.focusedItemId = null;
            draft.os.focus.activeZoneId = null;
          }) as typeof ctx.state,
          ...(dismissCommand ? { dispatch: dismissCommand } : {}),
        };
      }
      case "callback": {
        // Delegate to zone's onDismiss callback (e.g., drillUp).
        // The callback returns BaseCommand(s) that OS_ESCAPE dispatches.
        const callback = zoneEntry?.onDismiss;
        if (!callback) return;
        return { dispatch: callback };
      }
      default:
        return;
    }
  },
);
