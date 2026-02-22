/**
 * OS_ESCAPE Command — Escape key handling (kernel version)
 *
 * Behavior determined by Zone's dismiss config:
 * - "deselect": Clear current selection
 * - "close": Blur/close the zone
 * - "none": No action
 */

import { produce } from "immer";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";
import { ensureZone } from "../../state/utils";

export const OS_ESCAPE = os.defineCommand(
  "OS_ESCAPE",
  [],
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const zoneEntry = ZoneRegistry.get(activeZoneId);
    if (!zoneEntry) return;

    const config = zoneEntry.config;

    switch (config.dismiss?.escape) {
      case "deselect": {
        if (zone.selection.length === 0) return;
        return {
          state: produce(ctx.state, (draft) => {
            const z = ensureZone(draft.os, activeZoneId);
            z.selection = [];
            z.selectionAnchor = null;
          }) as typeof ctx.state,
        };
      }
      case "close": {
        // Dispatch onDismiss command if registered on this zone
        const dismissCommand = zoneEntry?.onDismiss;

        return {
          state: produce(ctx.state, (draft) => {
            const z = ensureZone(draft.os, activeZoneId);
            z.focusedItemId = null;
            // Clear active zone so components can detect dismiss
            draft.os.focus.activeZoneId = null;
          }) as typeof ctx.state,
          ...(dismissCommand ? { dispatch: dismissCommand } : {}),
        };
      }
      default:
        return;
    }
  },
);
