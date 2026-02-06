/**
 * FocusOrchestrator - Cross-Zone Navigation Manager
 * 
 * Logic for moving focus between zones (Tab flow, Escape).
 * Encapsulates FocusRegistry interactions.
 */

import { FocusRegistry } from '../registry/FocusRegistry.ts';
import { DOMRegistry } from '../registry/DOMRegistry.ts';
import { updateEntry } from '../pipeline/3-update/updateEntry.ts';
import { commitAll } from '../pipeline/4-commit/commitFocus.ts';

export const FocusOrchestrator = {
    /**
     * Move focus to the next/previous sibling zone.
     */
    traverseZone: (
        currentZoneId: string,
        direction: 'forward' | 'backward',
        fallbackConfig?: any // Optional config to use if target zone is missing one
    ): boolean => {
        const nextZoneId = FocusRegistry.getSiblingZone(direction);

        if (!nextZoneId) {
            console.warn('[FocusOrchestrator] No sibling zone found for', { currentZoneId, direction });
            return false;
        }

        const nextZoneEntry = FocusRegistry.getZoneEntry(nextZoneId);
        if (!nextZoneEntry || !nextZoneEntry.store) {
            console.warn('[FocusOrchestrator] Target zone entry invalid', { nextZoneId });
            return false;
        }

        const { store: nextZoneStore, config: nextZoneConfig } = nextZoneEntry;

        // 1. Activate the target zone
        FocusRegistry.setActiveZone(nextZoneId);

        // 2. Determine entry item
        const nextState = nextZoneStore.getState();
        const items = nextState.items;

        if (items.length > 0) {
            // Use target zone's navigate config for entry, or fallback
            // We assume 'navigate' config is what controls entry, 
            // but actually 'entry' is a top-level or navigate-level property depending on types.
            // Let's assume passed config has access to it.
            // Actually, updateEntry takes NavigateConfig.

            const entryConfig = nextZoneConfig?.navigate || fallbackConfig?.navigate;

            if (entryConfig) {
                const targetItem = updateEntry(items, entryConfig, {
                    lastFocusedId: nextState.lastFocusedId,
                    selection: nextState.selection,
                });

                if (targetItem) {
                    commitAll(nextZoneStore, { targetId: targetItem });
                    // TODO: Commit selection if 'followFocus' is true in target?
                    // Ideally we should use commitAll on target store.
                    return true;
                }
            }
        } else {
            // Empty zone focused?
            commitAll(nextZoneStore, { targetId: null });
            return true;
        }

        return false;
    },

    /**
     * Spatial cross-zone navigation (for seamless arrow keys)
     * Finds adjacent zone in the given direction based on visual position
     */
    traverseZoneSpatial: (
        currentZoneId: string,
        direction: 'up' | 'down' | 'left' | 'right',
        currentItemId: string | null
    ): boolean => {
        // 1. Get current position (item or zone)
        const currentItemRect = currentItemId
            ? DOMRegistry.getItem(currentItemId)?.getBoundingClientRect()
            : DOMRegistry.getGroupRect(currentZoneId);

        if (!currentItemRect) return false;

        const currentCenterX = (currentItemRect.left + currentItemRect.right) / 2;
        const currentCenterY = (currentItemRect.top + currentItemRect.bottom) / 2;

        // 2. Get all zone rects
        const allZoneRects = DOMRegistry.getAllGroupRects();

        // 3. Find candidate zones in target direction
        type ZoneCandidate = { id: string; rect: DOMRect; distance: number; alignment: number };
        const candidates: ZoneCandidate[] = [];

        for (const [zoneId, rect] of allZoneRects) {
            if (zoneId === currentZoneId) continue;

            // Check if zone is in target direction
            const isInDirection = (() => {
                switch (direction) {
                    case 'up': return rect.bottom <= currentItemRect.top;
                    case 'down': return rect.top >= currentItemRect.bottom;
                    case 'left': return rect.right <= currentItemRect.left;
                    case 'right': return rect.left >= currentItemRect.right;
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
                    distance = currentItemRect.top - rect.bottom;
                    alignment = Math.abs(zoneCenterX - currentCenterX);
                    break;
                case 'down':
                    distance = rect.top - currentItemRect.bottom;
                    alignment = Math.abs(zoneCenterX - currentCenterX);
                    break;
                case 'left':
                    distance = currentItemRect.left - rect.right;
                    alignment = Math.abs(zoneCenterY - currentCenterY);
                    break;
                case 'right':
                    distance = rect.left - currentItemRect.right;
                    alignment = Math.abs(zoneCenterY - currentCenterY);
                    break;
            }

            candidates.push({ id: zoneId, rect, distance, alignment });
        }

        if (candidates.length === 0) return false;

        // 4. Score and select best zone
        candidates.sort((a, b) => {
            const scoreA = a.distance + a.alignment * 0.3;
            const scoreB = b.distance + b.alignment * 0.3;
            return scoreA - scoreB;
        });

        const targetZoneId = candidates[0].id;
        const targetZoneEntry = FocusRegistry.getZoneEntry(targetZoneId);

        if (!targetZoneEntry?.store) return false;

        // 5. Find entry item in target zone closest to current position
        const targetStore = targetZoneEntry.store;
        const targetState = targetStore.getState();
        const targetItems = targetState.items;

        if (targetItems.length === 0) {
            // Empty zone - just activate it
            FocusRegistry.setActiveZone(targetZoneId);
            return true;
        }

        // Find closest item in target zone
        let closestItemId = targetItems[0];
        let closestScore = Infinity;

        for (const itemId of targetItems) {
            const itemEl = DOMRegistry.getItem(itemId);
            if (!itemEl) continue;

            const itemRect = itemEl.getBoundingClientRect();
            const itemCenterX = (itemRect.left + itemRect.right) / 2;
            const itemCenterY = (itemRect.top + itemRect.bottom) / 2;

            // Score based on alignment with original position
            const alignmentScore = direction === 'up' || direction === 'down'
                ? Math.abs(itemCenterX - currentCenterX)
                : Math.abs(itemCenterY - currentCenterY);

            // For entry, prefer items closest to the boundary we came from
            let entryScore: number;
            switch (direction) {
                case 'up': entryScore = -(itemRect.bottom); break; // Prefer bottom items
                case 'down': entryScore = itemRect.top; break; // Prefer top items
                case 'left': entryScore = -(itemRect.right); break; // Prefer right items
                case 'right': entryScore = itemRect.left; break; // Prefer left items
            }

            const score = alignmentScore + entryScore * 0.1;

            if (score < closestScore) {
                closestScore = score;
                closestItemId = itemId;
            }
        }

        // 6. Activate zone and focus item
        FocusRegistry.setActiveZone(targetZoneId);
        commitAll(targetStore, { targetId: closestItemId });

        return true;
    }
};
