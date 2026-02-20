/**
 * OS_CHECK Command — Toggle aria-checked state (kernel version)
 *
 * Maps to aria-checked. Triggered by Space on checkbox/switch roles,
 * or by click on checkbox elements.
 *
 * If the zone has onCheck registered, passes ZoneCursor to the callback.
 */

import { ZONE_CONFIG } from "../../2-contexts";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";
import { buildZoneCursor } from "../utils/buildZoneCursor";

interface CheckPayload {
  targetId?: string;
}

export const OS_CHECK = os.defineCommand(
  "OS_CHECK",
  [ZONE_CONFIG],
  (ctx) => (payload: CheckPayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const targetId = payload.targetId ?? zone.focusedItemId;
    if (!targetId) return;

    // Zone callback: pass cursor to onCheck
    const entry = ZoneRegistry.get(activeZoneId);
    if (entry?.onCheck) {
      const cursor = buildZoneCursor(zone);
      if (!cursor) return;
      // Override focusId with targetId (click target may differ from focused item)
      return {
        dispatch: entry.onCheck({ ...cursor, focusId: targetId }),
      };
    }

    // No onCheck registered — no-op
  },
);
