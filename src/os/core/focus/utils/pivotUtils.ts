// Pivot Resolution Utilities
// Resolves the local pivot item within a zone

/**
 * Pivot Resolver
 * Finds the local pivot item within a zone (last focused or current).
 * 
 * Note: This function accesses the DOM for hierarchical search.
 * For pure logic, consider passing resolved data from the caller.
 */
export function resolvePivot(
    zoneItems: string[],
    focusedItemId: string | null,
    zoneId: string
): string | null {
    if (!focusedItemId) return null;

    // Direct match
    if (zoneItems.includes(focusedItemId)) {
        return focusedItemId;
    }

    // Hierarchical search (if focused item is nested deep inside an Item that is part of this Zone)
    const itemEl = document.getElementById(focusedItemId);
    const zoneEl = document.querySelector(`[data-zone-id="${zoneId}"]`);

    if (itemEl && zoneEl) {
        let curr: HTMLElement | null = itemEl;
        while (curr && curr !== zoneEl) {
            const id = curr.getAttribute("data-item-id");
            if (id && zoneItems.includes(id)) {
                return id;
            }
            curr = curr.parentElement;
        }
    }

    return null;
}

/**
 * Bubble Path Construction
 * Constructs the path of zones to traverse for bubbling navigation.
 * Returns path from active zone to root (reversed focusPath).
 */
export function getBubblePath(
    focusPath: string[],
    sourceId?: string
): string[] {
    return focusPath.length > 0
        ? [...focusPath].reverse()
        : (sourceId ? [sourceId] : []);
}
