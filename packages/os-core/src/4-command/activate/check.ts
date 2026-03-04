/**
 * OS_CHECK Command — Toggle aria-checked state (kernel version)
 *
 * Always toggles aria-checked. For aria-pressed, use OS_PRESS instead.
 * Command type IS the ARIA declaration — no config lookup needed.
 */

import { ZONE_CONFIG } from "@os-core/3-inject";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { produce } from "immer";
import { os } from "../../engine/kernel";
import { ensureZone } from "../../schema/state/utils";
import { buildZoneCursor } from "../utils/buildZoneCursor";

interface CheckPayload {
  targetId?: string;
}

export const OS_CHECK = os.defineCommand(
  "OS_CHECK",
  [ZONE_CONFIG],
  (ctx) => (payload?: CheckPayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const targetId = (payload?.targetId) ?? zone.focusedItemId;
    if (!targetId) return;

    // Zone callback: pass cursor to onCheck
    const entry = ZoneRegistry.get(activeZoneId);
    if (entry?.onCheck) {
      const cursor = buildZoneCursor(zone);
      if (!cursor) return;
      return {
        dispatch: entry.onCheck({ ...cursor, focusId: targetId }),
      };
    }

    // Built-in toggle: items[id]["aria-checked"] = !current.
    // OS_CHECK → aria-checked. OS_PRESS → aria-pressed. No overlap.
    return {
      state: produce(ctx.state, (draft) => {
        const z = ensureZone(draft.os, activeZoneId);
        if (!z.items[targetId]) z.items[targetId] = {};
        z.items[targetId] = {
          ...z.items[targetId],
          "aria-checked": !(z.items[targetId]?.["aria-checked"] ?? false),
        };
      }),
    };
  },
);
