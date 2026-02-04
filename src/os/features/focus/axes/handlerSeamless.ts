// Seamless Navigation Handler
// Enables cross-zone navigation at boundaries
import type { Direction } from "@os/entities/Direction";
import type { ZoneMetadata } from "@os/entities/ZoneMetadata";

import { DOMInterface } from "@os/features/focus/lib/DOMInterface";

interface SeamlessContext {
    currentZoneId: string;
    direction: Direction;
    zoneRegistry: Record<string, ZoneMetadata>;
}

/**
 * Sort DOM elements by visual order
 */
function sortByVisualOrder(zones: ZoneMetadata[]): ZoneMetadata[] {
    return zones.sort((a, b) => {
        const rectA = DOMInterface.getZoneRect(a.id);
        const rectB = DOMInterface.getZoneRect(b.id);

        if (!rectA || !rectB) return 0;

        // Sort by Y first, then X (reading order)
        if (Math.abs(rectA.top - rectB.top) > 4) {
            return rectA.top - rectB.top;
        }
        return rectA.left - rectB.left;
    });
}

/**
 * Find sibling zone in the given direction
 * Uses DOM position for spatial accuracy, with sequential fallback
 */
export function handlerSeamless(ctx: SeamlessContext): ZoneMetadata | null {
    const { currentZoneId, direction, zoneRegistry } = ctx;
    const currentZone = zoneRegistry[currentZoneId];
    if (!currentZone?.parentId) return null;

    // Get sibling zones (same parent)
    const siblings = Object.values(zoneRegistry)
        .filter(z => z.parentId === currentZone.parentId && z.id !== currentZoneId);

    if (siblings.length === 0) return null;

    // Get DOM positions
    const currentRect = DOMInterface.getZoneRect(currentZoneId);
    if (!currentRect) return null;

    // Find best candidate based on spatial direction
    let best: ZoneMetadata | null = null;
    let bestScore = Infinity;

    for (const sibling of siblings) {
        const rect = DOMInterface.getZoneRect(sibling.id);
        if (!rect) continue;

        let isValid = false;
        let score = 0;

        switch (direction) {
            case "RIGHT":
                isValid = rect.left > currentRect.right - 2;
                score = rect.left - currentRect.right;
                break;
            case "LEFT":
                isValid = rect.right < currentRect.left + 2;
                score = currentRect.left - rect.right;
                break;
            case "DOWN":
                isValid = rect.top > currentRect.bottom - 2;
                score = rect.top - currentRect.bottom;
                break;
            case "UP":
                isValid = rect.bottom < currentRect.top + 2;
                score = currentRect.top - rect.bottom;
                break;
        }

        if (isValid && score < bestScore) {
            best = sibling;
            bestScore = score;
        }
    }

    // Sequential fallback: If spatial detection fails and we have vertical navigation,
    // try to find next/previous sibling in visual order (for Kanban-style layouts)
    if (!best && (direction === "DOWN" || direction === "UP")) {
        const sorted = sortByVisualOrder([currentZone, ...siblings]);
        const currentIdx = sorted.findIndex(z => z.id === currentZoneId);

        if (direction === "DOWN" && currentIdx < sorted.length - 1) {
            best = sorted[currentIdx + 1];
        } else if (direction === "UP" && currentIdx > 0) {
            best = sorted[currentIdx - 1];
        }
    }

    return best;
}

/**
 * Get entry item ID for seamless transition
 * Finds the item closest to the source item's position,
 * prioritizing items at the entry edge of the target zone
 */
export function getSeamlessEntryItem(
    targetZone: ZoneMetadata,
    direction: Direction,
    sourceItemId?: string
): string | null {
    const items = targetZone.items || [];
    if (items.length === 0) return null;

    // If no source item, use first/last based on direction
    if (!sourceItemId) {
        if (direction === "RIGHT" || direction === "DOWN") {
            return items[0];
        }
        return items[items.length - 1];
    }

    // Get source item's position
    let sourceRect: DOMRect | null = null;
    if (sourceItemId) {
        sourceRect = DOMInterface.getItemRect(sourceItemId);
    }

    // Fallback if no source item or rect not found
    if (!sourceRect) {
        return direction === "RIGHT" || direction === "DOWN" ? items[0] : items[items.length - 1];
    }

    // Collect all item rects
    const itemRects: { id: string; rect: DOMRect }[] = [];
    for (const itemId of items) {
        const rect = DOMInterface.getItemRect(itemId);
        if (rect) {
            itemRects.push({ id: itemId, rect });
        }
    }
    if (itemRects.length === 0) return items[0];

    const isHorizontal = direction === "LEFT" || direction === "RIGHT";

    // Entry edge filtering:
    // - UP: select from bottom edge of target zone (highest Y values)
    // - DOWN: select from top edge of target zone (lowest Y values)
    // - LEFT: select from right edge of target zone (highest X values)
    // - RIGHT: select from left edge of target zone (lowest X values)

    let candidates = itemRects;

    if (direction === "UP") {
        // Find items at the bottom edge (highest Y)
        const maxY = Math.max(...itemRects.map(i => i.rect.bottom));
        const threshold = 50; // pixels tolerance
        candidates = itemRects.filter(i => i.rect.bottom >= maxY - threshold);
    } else if (direction === "DOWN") {
        // Find items at the top edge (lowest Y)
        const minY = Math.min(...itemRects.map(i => i.rect.top));
        const threshold = 50;
        candidates = itemRects.filter(i => i.rect.top <= minY + threshold);
    } else if (direction === "LEFT") {
        // Find items at the right edge (highest X)
        const maxX = Math.max(...itemRects.map(i => i.rect.right));
        const threshold = 50;
        candidates = itemRects.filter(i => i.rect.right >= maxX - threshold);
    } else if (direction === "RIGHT") {
        // Find items at the left edge (lowest X)
        const minX = Math.min(...itemRects.map(i => i.rect.left));
        const threshold = 50;
        candidates = itemRects.filter(i => i.rect.left <= minX + threshold);
    }

    // If no candidates after filtering, fall back to all items
    if (candidates.length === 0) candidates = itemRects;

    // Now match spatial position among candidates
    const matchCoord = isHorizontal
        ? sourceRect.top + sourceRect.height / 2
        : sourceRect.left + sourceRect.width / 2;

    let bestItem: string | null = null;
    let bestDistance = Infinity;

    for (const { id, rect } of candidates) {
        const itemCoord = isHorizontal
            ? rect.top + rect.height / 2
            : rect.left + rect.width / 2;
        const distance = Math.abs(itemCoord - matchCoord);

        if (distance < bestDistance) {
            bestDistance = distance;
            bestItem = id;
        }
    }

    return bestItem || items[0];
}
