/**
 * resolveZoneSpatial - Calculate next zone for seamless arrow navigation
 * 
 * Pipeline Phase 3: UPDATE
 * Pure function - no side effects, no state mutations.
 * Returns the resolved target zone and item based on spatial positioning.
 */

export interface ZoneSpatialContext {
    /** Get rect for a specific item */
    getItemRect: (itemId: string) => DOMRect | undefined;
    /** Get rect for a specific group */
    getGroupRect: (groupId: string) => DOMRect | undefined;
    /** Get all group rects */
    getAllGroupRects: () => Map<string, DOMRect>;
    /** Get zone entry by ID */
    getGroupEntry: (id: string) => {
        store: any;
    } | undefined;
    /** Get DOM-based items for a zone */
    getGroupItems: (id: string) => string[];
}

export interface ZoneSpatialResult {
    /** Target zone ID */
    targetGroupId: string;
    /** Target item ID within the zone */
    targetItemId: string | null;
    /** The store to commit changes to */
    targetStore: any;
}

/**
 * Calculate the next zone and entry item based on spatial positioning.
 * Used for seamless arrow key navigation across zones.
 * 
 * @param currentGroupId - Current active zone ID
 * @param direction - Arrow direction
 * @param currentItemId - Currently focused item (for position reference)
 * @param context - DOM access functions (injected for testability)
 * @returns Result with target zone/item, or null if no valid target
 */
export function resolveZoneSpatial(
    currentGroupId: string,
    direction: 'up' | 'down' | 'left' | 'right',
    currentItemId: string | null,
    context: ZoneSpatialContext
): ZoneSpatialResult | null {
    // 1. Get current position (item or zone)
    const currentRect = currentItemId
        ? context.getItemRect(currentItemId)
        : context.getGroupRect(currentGroupId);

    if (!currentRect) return null;

    const currentCenterX = (currentRect.left + currentRect.right) / 2;
    const currentCenterY = (currentRect.top + currentRect.bottom) / 2;

    // 2. Get all zone rects
    const allGroupRects = context.getAllGroupRects();

    // 3. Find candidate zones in target direction
    type ZoneCandidate = { id: string; rect: DOMRect; distance: number; alignment: number };
    const candidates: ZoneCandidate[] = [];

    for (const [groupId, rect] of allGroupRects) {
        if (groupId === currentGroupId) continue;

        // Check if zone is in target direction
        const isInDirection = (() => {
            switch (direction) {
                case 'up': return rect.bottom <= currentRect.top;
                case 'down': return rect.top >= currentRect.bottom;
                case 'left': return rect.right <= currentRect.left;
                case 'right': return rect.left >= currentRect.right;
            }
        })();

        if (!isInDirection) continue;

        // Calculate distance and alignment
        const zoneCenterX = (rect.left + rect.right) / 2;
        const zoneCenterY = (rect.top + rect.bottom) / 2;

        let distance: number;
        let alignment: number;

        switch (direction) {
            case 'up':
                distance = currentRect.top - rect.bottom;
                alignment = Math.abs(zoneCenterX - currentCenterX);
                break;
            case 'down':
                distance = rect.top - currentRect.bottom;
                alignment = Math.abs(zoneCenterX - currentCenterX);
                break;
            case 'left':
                distance = currentRect.left - rect.right;
                alignment = Math.abs(zoneCenterY - currentCenterY);
                break;
            case 'right':
                distance = rect.left - currentRect.right;
                alignment = Math.abs(zoneCenterY - currentCenterY);
                break;
        }

        candidates.push({ id: groupId, rect, distance, alignment });
    }

    if (candidates.length === 0) return null;

    // 4. Score and select best zone
    candidates.sort((a, b) => {
        const scoreA = a.distance + a.alignment * 0.3;
        const scoreB = b.distance + b.alignment * 0.3;
        return scoreA - scoreB;
    });

    const targetGroupId = candidates[0].id;
    const targetEntry = context.getGroupEntry(targetGroupId);

    if (!targetEntry?.store) return null;

    const targetStore = targetEntry.store;

    // Use DOM-based items instead of store items
    const targetItems = context.getGroupItems(targetGroupId);

    // 5. Empty zone
    if (targetItems.length === 0) {
        return {
            targetGroupId,
            targetItemId: null,
            targetStore,
        };
    }

    // 6. Find closest item in target zone
    let closestItemId = targetItems[0];
    let closestScore = Infinity;

    for (const itemId of targetItems) {
        const itemRect = context.getItemRect(itemId);
        if (!itemRect) continue;

        const itemCenterX = (itemRect.left + itemRect.right) / 2;
        const itemCenterY = (itemRect.top + itemRect.bottom) / 2;

        // Score based on alignment with original position
        const alignmentScore = direction === 'up' || direction === 'down'
            ? Math.abs(itemCenterX - currentCenterX)
            : Math.abs(itemCenterY - currentCenterY);

        // For entry, prefer items closest to the boundary we came from
        let entryScore: number;
        switch (direction) {
            case 'up': entryScore = -(itemRect.bottom); break;
            case 'down': entryScore = itemRect.top; break;
            case 'left': entryScore = -(itemRect.right); break;
            case 'right': entryScore = itemRect.left; break;
        }

        const score = alignmentScore + entryScore * 0.1;

        if (score < closestScore) {
            closestScore = score;
            closestItemId = itemId;
        }
    }

    return {
        targetGroupId,
        targetItemId: closestItemId,
        targetStore,
    };
}
