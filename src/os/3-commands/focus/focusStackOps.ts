import type { WritableDraft } from "immer";
import type { AppState } from "../../state/appState";
import { ensureZone } from "../../state/utils";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";

// ═══════════════════════════════════════════════════════════════════
// resolveItemFallback — Find nearest neighbor for a missing item
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a stale item ID to the nearest existing neighbor.
 *
 * Strategy: next → prev → null.
 * Uses the item's last known position (via index hint from ordered list).
 *
 * Flutter equivalent: FocusScopeNode auto-recovery on child disposal.
 */
export function resolveItemFallback(
    targetId: string,
    items: string[],
    hint?: { index?: number },
): string | null {
    if (items.length === 0) return null;
    if (items.includes(targetId)) return targetId;

    // Target is gone — use index hint if available
    if (hint?.index !== undefined) {
        // Clamp to valid range: try same index (next), then prev
        const idx = Math.min(hint.index, items.length - 1);
        return items[idx] ?? items[items.length - 1] ?? null;
    }

    // No hint — default to first item (OS-level safety net)
    return items[0] ?? null;
}

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

    // Store item index for neighbor resolution on pop
    let index: number | undefined;
    if (activeZoneId && currentItemId) {
        const zoneEntry = ZoneRegistry.get(activeZoneId);
        const items = zoneEntry?.getItems?.();
        if (items) {
            index = items.indexOf(currentItemId);
            if (index === -1) index = undefined;
        }
    }

    draft.os.focus.focusStack.push({
        zoneId: activeZoneId ?? "",
        itemId: currentItemId,
        index,
        ...(opts?.triggeredBy !== undefined
            ? { triggeredBy: opts.triggeredBy }
            : {}),
    });
}

/**
 * Pop top entry from focus stack and restore focus.
 * Call inside an Immer produce() block.
 * Returns true if restoration occurred, false if stack was empty.
 *
 * Lazy Resolution (Rules #15): If the stored itemId no longer exists
 * in the zone's items (via ZoneRegistry.getItems), resolves to the
 * nearest neighbor. This is the Flutter FocusScopeNode pattern.
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

    // Restore item — with Lazy Resolution
    if (entry.itemId) {
        const zoneEntry = ZoneRegistry.get(entry.zoneId);
        const items = zoneEntry?.getItems?.();

        if (items && !items.includes(entry.itemId)) {
            // Stale: item was deleted during overlay/stack session
            // Use entry.index as hint for neighbor resolution
            const resolved = resolveItemFallback(entry.itemId, items, { index: entry.index });
            zone.focusedItemId = resolved;
            zone.lastFocusedId = resolved;
        } else {
            // Item still exists (or no getItems registered — legacy)
            zone.focusedItemId = entry.itemId;
            zone.lastFocusedId = entry.itemId;
        }
    }

    return true;
}
