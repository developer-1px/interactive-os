/**
 * OS Clipboard Commands — OS_COPY, OS_CUT, OS_PASTE
 *
 * OS-level commands for clipboard operations.
 * Follows the same pattern as ACTIVATE/NAVIGATE:
 *   Listener dispatches OS command → handler resolves active zone → dispatches zone's bound app command.
 *
 * Zone binding: <OS.Zone onCopy={TODO_COPY()} onCut={TODO_CUT()} onPaste={TODO_PASTE()}>
 */

import { ZoneRegistry } from "../2-contexts/zoneRegistry";
import { kernel } from "../kernel";

export const OS_COPY = kernel.defineCommand("OS_COPY", (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const entry = ZoneRegistry.get(activeZoneId);
    if (!entry?.onCopy) return;

    return { dispatch: entry.onCopy };
});

export const OS_CUT = kernel.defineCommand("OS_CUT", (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const entry = ZoneRegistry.get(activeZoneId);
    if (!entry?.onCut) return;

    return { dispatch: entry.onCut };
});

export const OS_PASTE = kernel.defineCommand("OS_PASTE", (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const entry = ZoneRegistry.get(activeZoneId);
    if (!entry?.onPaste) return;

    return { dispatch: entry.onPaste };
});
