// Spatial Navigation Engine (2D: grid)
// Physics-based navigation using DOM Rects

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface NavigationContext {
    currentId: string | null;
    items: string[];
    direction: Direction;
    itemRects?: Record<string, DOMRect>;
    stickyX?: number | null;
    stickyY?: number | null;
}

/**
 * Spatial Navigation Engine
 * Physics-based navigation using DOM Rects.
 */
export function navigationSpatial(ctx: NavigationContext): string | null {
    const { currentId, items, direction, stickyX, stickyY, itemRects } = ctx;
    if (!currentId) return items[0] || null;

    const currentRect = itemRects?.[currentId] || document.getElementById(currentId)?.getBoundingClientRect();
    if (!currentRect) return null;

    let bestId: string | null = null;
    let minScore = Infinity;

    items.forEach((id) => {
        if (id === currentId) return;

        const rect = itemRects?.[id] || document.getElementById(id)?.getBoundingClientRect();
        if (!rect) return;

        // 1. Strict Directional Filter
        let isCorrectDirection = false;
        switch (direction) {
            case "UP": isCorrectDirection = rect.bottom <= currentRect.top + 2; break;
            case "DOWN": isCorrectDirection = rect.top >= currentRect.bottom - 2; break;
            case "LEFT": isCorrectDirection = rect.right <= currentRect.left + 2; break;
            case "RIGHT": isCorrectDirection = rect.left >= currentRect.right - 2; break;
        }
        if (!isCorrectDirection) return;

        // 2. Calculate Distances
        let dPrimary = 0;
        let dSecondary = 0;
        let dCenter = 0;

        if (direction === "UP" || direction === "DOWN") {
            dPrimary = direction === "UP" ? currentRect.top - rect.bottom : rect.top - currentRect.bottom;

            const sourceX = (stickyX !== undefined && stickyX !== null)
                ? stickyX
                : (currentRect.left + currentRect.width / 2);

            if (stickyX !== undefined && stickyX !== null) {
                if (stickyX >= rect.left && stickyX <= rect.right) {
                    dSecondary = 0;
                } else {
                    dSecondary = Math.min(Math.abs(stickyX - rect.left), Math.abs(stickyX - rect.right));
                }
            } else {
                dSecondary = Math.max(0, rect.left - currentRect.right, currentRect.left - rect.right);
            }

            const targetX = rect.left + rect.width / 2;
            dCenter = Math.abs(targetX - sourceX);
        } else {
            dPrimary = direction === "LEFT" ? currentRect.left - rect.right : rect.left - currentRect.right;

            const sourceY = (stickyY !== undefined && stickyY !== null)
                ? stickyY
                : (currentRect.top + currentRect.height / 2);

            if (stickyY !== undefined && stickyY !== null) {
                if (stickyY >= rect.top && stickyY <= rect.bottom) {
                    dSecondary = 0;
                } else {
                    dSecondary = Math.min(Math.abs(stickyY - rect.top), Math.abs(stickyY - rect.bottom));
                }
            } else {
                dSecondary = Math.max(0, rect.top - currentRect.bottom, currentRect.top - rect.bottom);
            }

            const targetY = rect.top + rect.height / 2;
            dCenter = Math.abs(targetY - sourceY);
        }

        // 3. Scoring Heuristic
        const isOverlapping = dSecondary === 0;
        const overlapPenalty = isOverlapping ? 0 : 10_000_000;
        const weightedScore = (dPrimary * dPrimary) + (dSecondary * dSecondary * 10) + dCenter;
        const finalScore = overlapPenalty + weightedScore;

        if (finalScore < minScore) {
            minScore = finalScore;
            bestId = id;
        }
    });

    return bestId;
}
