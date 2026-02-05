/**
 * Spatial Navigation Engine
 * 
 * A W3C CSS Spatial Navigation-inspired algorithm for 2D focus movement.
 * Reference: https://drafts.csswg.org/css-nav-1/
 * 
 * Core Algorithm:
 * 1. Filter candidates by direction (only elements in the movement direction)
 * 2. Calculate "distance" using projection + orthogonal components
 * 3. Select the candidate with the minimum distance
 */

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface NavigationContext {
    currentId: string | null;
    items: string[];
    direction: Direction;
    itemRects?: Record<string, DOMRect>;
    stickyX?: number | null;
    stickyY?: number | null;
}

interface Point {
    x: number;
    y: number;
}

interface Rect {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
}

// ============================================================================
// Geometry Helpers
// ============================================================================

function toRect(domRect: DOMRect): Rect {
    return {
        top: domRect.top,
        right: domRect.right,
        bottom: domRect.bottom,
        left: domRect.left,
        width: domRect.width,
        height: domRect.height,
    };
}

function getCenter(rect: Rect): Point {
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}

// ============================================================================
// Direction-based Filtering
// ============================================================================

/**
 * Check if the candidate is in the specified direction from the current element.
 * Uses edge comparison: the candidate must be strictly beyond the current element's edge.
 */
function isInDirection(current: Rect, candidate: Rect, direction: Direction): boolean {
    // Tolerance for floating point precision
    const EPSILON = 0.5;

    switch (direction) {
        case "UP":
            return candidate.bottom <= current.top + EPSILON;
        case "DOWN":
            return candidate.top >= current.bottom - EPSILON;
        case "LEFT":
            return candidate.right <= current.left + EPSILON;
        case "RIGHT":
            return candidate.left >= current.right - EPSILON;
    }
}

// ============================================================================
// Distance Calculation (W3C-inspired)
// ============================================================================

/**
 * Calculate the spatial distance between two rectangles in a given direction.
 * 
 * The distance is composed of:
 * 1. Projection Distance: How far along the primary axis
 * 2. Orthogonal Distance: How far off-axis (perpendicular alignment)
 * 
 * W3C uses: distance = A + B + C + D
 * Where: A = projection, B = orthogonal, C = distance_to_boundary, D = sqrt(A²+B²)
 * 
 * Simplified here: distance = projection² + (orthogonal × weight)²
 * This naturally prefers aligned elements while still considering distance.
 */
function calculateDistance(
    current: Rect,
    candidate: Rect,
    direction: Direction,
    stickyX: number | null | undefined,
    stickyY: number | null | undefined
): number {
    const isVertical = direction === "UP" || direction === "DOWN";

    // -------------------------------------------------------------------------
    // 1. Projection Distance (along the movement axis)
    // -------------------------------------------------------------------------
    let projection: number;

    if (isVertical) {
        projection = direction === "UP"
            ? current.top - candidate.bottom
            : candidate.top - current.bottom;
    } else {
        projection = direction === "LEFT"
            ? current.left - candidate.right
            : candidate.left - current.right;
    }

    // Clamp negative values (shouldn't happen due to isInDirection, but safety)
    projection = Math.max(0, projection);

    // -------------------------------------------------------------------------
    // 2. Orthogonal Distance (perpendicular to movement axis)
    //    This measures how "aligned" the candidate is.
    //    If there's overlap on the cross-axis, orthogonal = 0 (perfectly aligned).
    // -------------------------------------------------------------------------
    let orthogonal: number;

    if (isVertical) {
        // For vertical movement, measure horizontal alignment
        const referenceX = stickyX ?? getCenter(current).x;

        // Check if reference point overlaps with candidate's horizontal span
        if (referenceX >= candidate.left && referenceX <= candidate.right) {
            orthogonal = 0;
        } else {
            // Distance to the nearest horizontal edge
            orthogonal = Math.min(
                Math.abs(referenceX - candidate.left),
                Math.abs(referenceX - candidate.right)
            );
        }
    } else {
        // For horizontal movement, measure vertical alignment
        const referenceY = stickyY ?? getCenter(current).y;

        // Check if reference point overlaps with candidate's vertical span
        if (referenceY >= candidate.top && referenceY <= candidate.bottom) {
            orthogonal = 0;
        } else {
            // Distance to the nearest vertical edge
            orthogonal = Math.min(
                Math.abs(referenceY - candidate.top),
                Math.abs(referenceY - candidate.bottom)
            );
        }
    }

    // -------------------------------------------------------------------------
    // 3. Combined Distance Score
    //    Orthogonal weight is higher to strongly prefer aligned elements.
    //    This matches the intuition that users expect focus to stay in "lanes".
    // -------------------------------------------------------------------------
    const ORTHOGONAL_WEIGHT = 3;

    return projection + (orthogonal * ORTHOGONAL_WEIGHT);
}

// ============================================================================
// Main Navigation Function
// ============================================================================

/**
 * Find the best navigation target in the specified direction.
 * 
 * Algorithm:
 * 1. Get current element's rect
 * 2. Filter all candidates to those in the correct direction
 * 3. Calculate distance for each candidate
 * 4. Return the candidate with minimum distance
 */
export function navigationSpatial(ctx: NavigationContext): string | null {
    const { currentId, items, direction, stickyX, stickyY, itemRects } = ctx;

    // No current element: fallback to first item
    if (!currentId) {
        return items[0] ?? null;
    }

    // Get current element's rect
    const currentDomRect = itemRects?.[currentId]
        ?? document.getElementById(currentId)?.getBoundingClientRect();

    if (!currentDomRect) {
        return null;
    }

    const currentRect = toRect(currentDomRect);

    // Find best candidate
    let bestId: string | null = null;
    let bestDistance = Infinity;

    for (const candidateId of items) {
        // Skip self
        if (candidateId === currentId) continue;

        // Get candidate rect
        const candidateDomRect = itemRects?.[candidateId]
            ?? document.getElementById(candidateId)?.getBoundingClientRect();

        if (!candidateDomRect) continue;

        const candidateRect = toRect(candidateDomRect);

        // Filter: must be in the correct direction
        if (!isInDirection(currentRect, candidateRect, direction)) continue;

        // Calculate distance
        const distance = calculateDistance(
            currentRect,
            candidateRect,
            direction,
            stickyX,
            stickyY
        );

        // Update best if this is closer
        if (distance < bestDistance) {
            bestDistance = distance;
            bestId = candidateId;
        }
    }

    return bestId;
}
