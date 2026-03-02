/**
 * OS_CHECK Command — Toggle aria-checked state (kernel version)
 *
 * Maps to aria-checked. Triggered by Space/Enter on checkbox/switch roles,
 * or by click on checkbox elements.
 *
 * If the zone has onCheck registered, passes ZoneCursor to the callback.
 * If no onCheck and check.mode="check": built-in toggle (selection toggle).
 */

import { ZONE_CONFIG } from "@os/3-inject";
import { ZoneRegistry } from "@os/core/engine/registries/zoneRegistry";
import { produce } from "immer";
import { os } from "../../core/engine/kernel";
import { ensureZone } from "../../core/schema/state/utils";
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

    // Built-in toggle: when check.mode="check" (switch, checkbox),
    // toggle the item in selection directly. No callback needed.
    const checkMode = entry?.config?.check?.mode ?? "none";
    if (checkMode === "check") {
      return {
        state: produce(ctx.state, (draft) => {
          const z = ensureZone(draft.os, activeZoneId);
          if (z.selection.includes(targetId)) {
            z.selection = z.selection.filter((id: string) => id !== targetId);
          } else {
            z.selection.push(targetId);
          }
        }),
      };
    }
  },
);
