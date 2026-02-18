/**
 * OS_ESCAPE Command — Escape key handling (kernel version)
 *
 * Behavior determined by Zone's dismiss config:
 * - "deselect": Clear current selection
 * - "close": Blur/close the zone
 * - "none": No action
 */

import { produce } from "immer";
import { ZONE_CONFIG } from "../../2-contexts";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import { ensureZone } from "../../state/utils";

export const ESCAPE = kernel.defineCommand(
  "OS_ESCAPE",
  [ZONE_CONFIG],
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const config = ctx.inject(ZONE_CONFIG);

    switch (config.dismiss.escape) {
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
        const zoneEntry = ZoneRegistry.get(activeZoneId);
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
