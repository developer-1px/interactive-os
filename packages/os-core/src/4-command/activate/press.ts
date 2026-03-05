/**
 * OS_PRESS Command — Toggle aria-pressed state (toggle button pattern)
 *
 * Maps to aria-pressed. Triggered by Space on toggle button roles.
 * Semantically distinct from OS_CHECK (aria-checked) — same toggle
 * mechanism but different ARIA attribute projection.
 *
 * command type → aria state:
 *   OS_CHECK → aria-checked (checkbox, radio, switch)
 *   OS_PRESS → aria-pressed (toggle button)
 *
 * @see design-principles.md #31
 */

import { ZONE_CONFIG } from "@os-core/3-inject";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { produce } from "immer";
import { os } from "../../engine/kernel";
import { ensureZone } from "../../schema/state/utils";
import { buildZoneCursor } from "../utils/buildZoneCursor";

interface PressPayload {
  targetId?: string;
}

export const OS_PRESS = os.defineCommand(
  "OS_PRESS",
  [ZONE_CONFIG],
  (ctx) => (payload?: PressPayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const targetId = payload?.targetId ?? zone.focusedItemId;
    if (!targetId) return;

    // Zone callback: pass cursor to onCheck (reuse same callback slot)
    const entry = ZoneRegistry.get(activeZoneId);
    if (entry?.onCheck) {
      const cursor = buildZoneCursor(zone);
      if (!cursor) return;
      return {
        dispatch: entry.onCheck({ ...cursor, focusId: targetId }),
      };
    }

    // Built-in toggle: items[id]["aria-pressed"] = !current.
    // OS_PRESS being dispatched means the zone declared aria-pressed behavior.
    // No config check needed — command type IS the declaration.
    return {
      state: produce(ctx.state, (draft) => {
        const z = ensureZone(draft.os, activeZoneId);
        if (!z.items[targetId]) z.items[targetId] = {};
        z.items[targetId] = {
          ...z.items[targetId],
          "aria-pressed": !(z.items[targetId]?.["aria-pressed"] ?? false),
        };
      }),
    };
  },
);
