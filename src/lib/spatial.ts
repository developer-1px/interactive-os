/**
 * Spatial - Generic 2D Element Positioning Library
 * 
 * Framework-agnostic utilities for spatial queries on positioned elements.
 * Works with any element registry that provides HTMLElement references.
 */

// ============================================================================
// Types
// ============================================================================

export interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

export interface SpatialNode<T = unknown> {
    id: string;
    el: HTMLElement;
    rect: Rect;
    data?: T;
}

export type SortAxis = 'horizontal' | 'vertical' | 'reading';
export type Direction = 'up' | 'down' | 'left' | 'right';

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get bounding rect with center points
 */
export function getRect(el: HTMLElement): Rect {
    const r = el.getBoundingClientRect();
    return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
        centerX: r.left + r.width / 2,
        centerY: r.top + r.height / 2,
    };
}

/**
 * Create a SpatialNode from element
 */
export function toSpatialNode<T>(id: string, el: HTMLElement, data?: T): SpatialNode<T> {
    return { id, el, rect: getRect(el), data };
}

/**
 * Check if element is visible (has dimensions)
 */
export function isVisible(node: SpatialNode): boolean {
    return node.rect.width > 0 && node.rect.height > 0;
}

// ============================================================================
// Sorting
// ============================================================================

/**
 * Sort nodes by axis
 */
export function sortByAxis<T>(nodes: SpatialNode<T>[], axis: SortAxis): SpatialNode<T>[] {
    return [...nodes].sort((a, b) => {
        switch (axis) {
            case 'horizontal':
                return a.rect.left - b.rect.left;
            case 'vertical':
                return a.rect.top - b.rect.top;
            case 'reading':
            default:
                // Row-first, then column (reading order)
                const rowThreshold = 10;
                if (Math.abs(a.rect.top - b.rect.top) > rowThreshold) {
                    return a.rect.top - b.rect.top;
                }
                return a.rect.left - b.rect.left;
        }
    });
}

// ============================================================================
// Navigation
// ============================================================================

/**
 * Find next node in sequence
 */
export function findNext<T>(
    currentId: string,
    nodes: SpatialNode<T>[],
    options: { axis?: SortAxis; wrap?: boolean; reverse?: boolean } = {}
): SpatialNode<T> | null {
    const { axis = 'reading', wrap = false, reverse = false } = options;
    const sorted = sortByAxis(nodes, axis);
    const currentIdx = sorted.findIndex(n => n.id === currentId);

    if (currentIdx === -1) return sorted[0] ?? null;

    const direction = reverse ? -1 : 1;
    let nextIdx = currentIdx + direction;

    if (wrap) {
        nextIdx = (nextIdx + sorted.length) % sorted.length;
    }

    if (nextIdx < 0 || nextIdx >= sorted.length) {
        return null;
    }

    return sorted[nextIdx];
}

/**
 * Find nearest node in direction (spatial proximity)
 */
export function findNearest<T>(
    from: SpatialNode<T>,
    candidates: SpatialNode<T>[],
    direction: Direction
): SpatialNode<T> | null {
    const validCandidates = candidates.filter(c => {
        if (c.id === from.id) return false;

        switch (direction) {
            case 'up': return c.rect.centerY < from.rect.centerY;
            case 'down': return c.rect.centerY > from.rect.centerY;
            case 'left': return c.rect.centerX < from.rect.centerX;
            case 'right': return c.rect.centerX > from.rect.centerX;
        }
    });

    if (validCandidates.length === 0) return null;

    // Score by distance + alignment
    const scored = validCandidates.map(c => {
        const dx = c.rect.centerX - from.rect.centerX;
        const dy = c.rect.centerY - from.rect.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Penalize misalignment based on direction
        let penalty = 0;
        if (direction === 'up' || direction === 'down') {
            penalty = Math.abs(dx) * 0.5; // Horizontal misalignment
        } else {
            penalty = Math.abs(dy) * 0.5; // Vertical misalignment
        }

        return { node: c, score: distance + penalty };
    });

    scored.sort((a, b) => a.score - b.score);
    return scored[0]?.node ?? null;
}

// ============================================================================
// Registry Helpers
// ============================================================================

/**
 * Convert a registry object to SpatialNodes
 */
export function fromRegistry<T extends { el?: HTMLElement | null }>(
    registry: Record<string, T>
): SpatialNode<T>[] {
    return Object.entries(registry)
        .filter(([, v]) => v.el != null)
        .map(([id, data]) => toSpatialNode(id, data.el!, data))
        .filter(isVisible);
}
