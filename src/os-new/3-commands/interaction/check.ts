/**
 * OS_CHECK Command — Toggle aria-checked state (kernel version)
 *
 * Maps to aria-checked. Triggered by Space on checkbox/switch roles,
 * or by click on checkbox elements.
 *
 * If the zone has onCheck registered, dispatches that (app semantics).
 */

import { ZONE_CONFIG } from "../../2-contexts";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import { resolveFocusId } from "../utils/resolveFocusId";

interface CheckPayload {
    targetId?: string;
}

export const OS_CHECK = kernel.defineCommand(
    "OS_CHECK",
    [ZONE_CONFIG],
    (ctx) => (payload: CheckPayload) => {
        const { activeZoneId } = ctx.state.os.focus;
        if (!activeZoneId) return;

        const zone = ctx.state.os.focus.zones[activeZoneId];
        if (!zone) return;

        const targetId = payload.targetId ?? zone.focusedItemId;
        if (!targetId) return;

        // Zone callback: dispatch onCheck if registered
        const entry = ZoneRegistry.get(activeZoneId);
        if (entry?.onCheck) {
            return {
                dispatch: resolveFocusId(entry.onCheck, targetId),
            };
        }

        // No onCheck registered — no-op (pure CHECK has no default OS behavior)
    },
);
