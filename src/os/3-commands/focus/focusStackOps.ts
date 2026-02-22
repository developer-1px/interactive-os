/**
 * Focus Stack Operations — Pure state mutation helpers.
 *
 * Shared by OS_STACK_PUSH/POP and OS_OVERLAY_OPEN/CLOSE.
 * Single source of truth for focus save/restore logic.
 */

import type { WritableDraft } from "immer";
import type { AppState } from "../../state/appState";
import { ensureZone } from "../../state/utils";

/**
 * Push current focus onto the focus stack.
 * Call inside an Immer produce() block.
 */
export function applyFocusPush(
    draft: WritableDraft<AppState>,
    opts?: { triggeredBy?: string },
): void {
    const { activeZoneId } = draft.os.focus;
    const currentItemId = activeZoneId
        ? (draft.os.focus.zones[activeZoneId]?.focusedItemId ?? null)
        : null;

    draft.os.focus.focusStack.push({
        zoneId: activeZoneId ?? "",
        itemId: currentItemId,
        ...(opts?.triggeredBy !== undefined
            ? { triggeredBy: opts.triggeredBy }
            : {}),
    });
}

/**
 * Pop top entry from focus stack and restore focus.
 * Call inside an Immer produce() block.
 * Returns true if restoration occurred, false if stack was empty.
 */
export function applyFocusPop(
    draft: WritableDraft<AppState>,
): boolean {
    const stack = draft.os.focus.focusStack;
    if (stack.length === 0) return false;

    const entry = stack[stack.length - 1];
    stack.pop();

    if (!entry?.zoneId) return false;

    // Restore zone
    const zone = ensureZone(draft.os, entry.zoneId);
    draft.os.focus.activeZoneId = entry.zoneId;

    // Restore item
    if (entry.itemId) {
        zone.focusedItemId = entry.itemId;
        zone.lastFocusedId = entry.itemId;
    }

    return true;
}
