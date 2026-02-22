/**
 * OS_CUT — Cut selected items via zone's onCut callback.
 *
 * Passes ZoneCursor to the app callback. Clears selection after cut.
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";
import { OS_SELECTION_CLEAR } from "../selection/clear";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const OS_CUT = os.defineCommand("OS_CUT", (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    const entry = ZoneRegistry.get(activeZoneId);
    if (!entry?.onCut) return;

    const cursor = buildZoneCursor(zone);
    if (!cursor) return;

    const result = entry.onCut(cursor);
    const commands = Array.isArray(result) ? [...result] : [result];

    // OS clears selection after cut
    if (cursor.selection.length > 0) {
        commands.push(OS_SELECTION_CLEAR({ zoneId: activeZoneId }));
    }

    return { dispatch: commands };
});
