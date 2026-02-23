/**
 * OS_PASTE — Paste via zone's onPaste callback.
 *
 * Passes ZoneCursor to the app callback with focusId as paste target.
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const OS_PASTE = os.defineCommand("OS_PASTE", (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    const entry = ZoneRegistry.get(activeZoneId);
    if (!entry?.onPaste) return;

    // Paste: cursor with focusId (paste target). Empty focusId = append at end.
    const cursor = buildZoneCursor(zone, activeZoneId) ?? {
        focusId: "",
        selection: [],
        anchor: null,
        isExpandable: false,
        isDisabled: false,
        treeLevel: undefined,
    };

    return { dispatch: entry.onPaste(cursor) };
});
