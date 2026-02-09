/**
 * OS_ESCAPE Command — Escape key handling (kernel version)
 *
 * Behavior determined by Zone's dismiss config:
 * - "deselect": Clear current selection
 * - "close": Blur/close the zone
 * - "none": No action
 */

import { produce } from "immer";
import { ZONE_CONFIG } from "../2-contexts";
import { kernel } from "../kernel";
import { ensureZone } from "../state/utils";

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
          }),
        };
      }
      case "close": {
        return {
          state: produce(ctx.state, (draft) => {
            const z = ensureZone(draft.os, activeZoneId);
            z.focusedItemId = null;
          }),
          blur: true,
        };
      }
      default:
        return;
    }
  },
);
