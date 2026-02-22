/**
 * OS_COPY — Copy selected items via zone's onCopy callback.
 *
 * Passes ZoneCursor to the app callback. App decides format.
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const OS_COPY = os.defineCommand("OS_COPY", (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    const entry = ZoneRegistry.get(activeZoneId);
    if (!entry?.onCopy) return;

    const cursor = buildZoneCursor(zone);
    if (!cursor) return;

    return { dispatch: entry.onCopy(cursor) };
});
