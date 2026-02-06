import type { Direction, NavigateConfig, FocusNode } from '../../../types';
import { DOM } from '../../../lib/dom';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface NavigateResult {
    targetId: string | null;
    stickyX: number | null;
    stickyY: number | null;
}

export type NavigationStrategy = (
    currentId: string | null,
    direction: Direction,
    items: string[],
    config: NavigateConfig,
    spatial: { stickyX: number | null; stickyY: number | null }
) => NavigateResult;

// ═══════════════════════════════════════════════════════════════════
// Default Strategies
// ═══════════════════════════════════════════════════════════════════

const resolveLinear: NavigationStrategy = (currentIndex, direction, items, config) => {
    // Note: currentIndex is passed as ID in the signature, so we need to find index
    // But the signature says currentId: string | null.
    // Let's fix the implementation to match the signature.

    // Safety check if we got an index instead of ID (due to casting in previous code)
    // Actually, let's keep it strictly ID based in the interface.

    const currentId = currentIndex as string | null;
    if (!currentId) return { targetId: items[0], stickyX: null, stickyY: null };

    const idx = items.indexOf(currentId);
    if (idx === -1) return { targetId: items[0], stickyX: null, stickyY: null };

    const isForward = direction === 'down' || direction === 'right';
    const delta = isForward ? 1 : -1;
    let nextIndex = idx + delta;

    // Boundary handling
    if (nextIndex < 0) {
        nextIndex = config.loop ? items.length - 1 : 0;
    } else if (nextIndex >= items.length) {
        nextIndex = config.loop ? 0 : items.length - 1;
    }

    return {
        targetId: items[nextIndex],
        stickyX: null,
        stickyY: null,
    };
};

/**
 * TV-Style Spatial Navigation (2-Phase Projection Algorithm)
 * 
 * Based on W3C CSS Spatial Navigation spec and Android TV FocusFinder.
 * Uses projection zones instead of overlap-based filtering.
 * 
 * Phase 1: Find candidates within the "projection zone" (visually aligned)
 * Phase 2: Fallback to any candidate in the target direction
 */
const resolveSpatial: NavigationStrategy = (currentId, direction, items, _config, spatial) => {
    if (!currentId) return { targetId: null, stickyX: null, stickyY: null };

    const currentEl = DOM.getItem(currentId);
    if (!currentEl) {
        return { targetId: currentId, stickyX: null, stickyY: null };
    }

    const currentRect = currentEl.getBoundingClientRect();
    const currentCenterX = (currentRect.left + currentRect.right) / 2;
    const currentCenterY = (currentRect.top + currentRect.bottom) / 2;

    // Use sticky position for alignment, or current center
    const anchorX = spatial.stickyX ?? currentCenterX;
    const anchorY = spatial.stickyY ?? currentCenterY;

    const nodes: FocusNode[] = [];

    // Build node list with rects
    for (const id of items) {
        if (id === currentId) continue;
        const el = DOM.getItem(id);
        if (!el) continue;
        nodes.push({ id, element: el, rect: el.getBoundingClientRect() });
    }

    // ═══════════════════════════════════════════════════════════════════
    // Helper: Check if node is in target direction
    // ═══════════════════════════════════════════════════════════════════
    const isInDirection = (node: FocusNode): boolean => {
        switch (direction) {
            case 'up':
                return node.rect.bottom <= currentRect.top;
            case 'down':
                return node.rect.top >= currentRect.bottom;
            case 'left':
                return node.rect.right <= currentRect.left;
            case 'right':
                return node.rect.left >= currentRect.right;
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // Helper: Check if node is in projection zone (extended alignment)
    // ═══════════════════════════════════════════════════════════════════
    const isInProjectionZone = (node: FocusNode): boolean => {
        if (!isInDirection(node)) return false;

        // Projection zone: extend current element's bounds into target direction
        // A node is in projection zone if it overlaps with the extended bounds
        if (direction === 'up' || direction === 'down') {
            // Vertical movement: check horizontal overlap with current element
            return node.rect.right > currentRect.left && node.rect.left < currentRect.right;
        } else {
            // Horizontal movement: check vertical overlap with current element
            return node.rect.bottom > currentRect.top && node.rect.top < currentRect.bottom;
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // 2-Phase Candidate Selection
    // ═══════════════════════════════════════════════════════════════════

    // Phase 1: Candidates in projection zone (visually aligned)
    const projectionCandidates = nodes.filter(isInProjectionZone);

    // Phase 2: Fallback to any candidate in target direction
    const directionCandidates = projectionCandidates.length > 0
        ? projectionCandidates
        : nodes.filter(isInDirection);

    if (directionCandidates.length === 0) {
        return { targetId: currentId, stickyX: spatial.stickyX, stickyY: spatial.stickyY };
    }

    // ═══════════════════════════════════════════════════════════════════
    // Scoring: Distance-primary, Alignment-secondary
    // ═══════════════════════════════════════════════════════════════════
    let best = directionCandidates[0];
    let bestScore = Infinity;

    for (const node of directionCandidates) {
        const nodeCenterX = (node.rect.left + node.rect.right) / 2;
        const nodeCenterY = (node.rect.top + node.rect.bottom) / 2;

        // Primary: Distance along movement axis
        let distance: number;
        switch (direction) {
            case 'up':
                distance = currentRect.top - node.rect.bottom;
                break;
            case 'down':
                distance = node.rect.top - currentRect.bottom;
                break;
            case 'left':
                distance = currentRect.left - node.rect.right;
                break;
            case 'right':
                distance = node.rect.left - currentRect.right;
                break;
        }

        // Secondary: Alignment with anchor (perpendicular axis)
        const alignment = direction === 'up' || direction === 'down'
            ? Math.abs(nodeCenterX - anchorX)
            : Math.abs(nodeCenterY - anchorY);

        // TV-style scoring: distance is primary, alignment is tie-breaker
        const score = distance + alignment * 0.3;

        if (score < bestScore) {
            bestScore = score;
            best = node;
        }
    }

    // Update sticky based on movement direction
    const newStickyX = direction === 'up' || direction === 'down' ? anchorX : null;
    const newStickyY = direction === 'left' || direction === 'right' ? anchorY : null;

    return {
        targetId: best.id,
        stickyX: newStickyX,
        stickyY: newStickyY,
    };
};

// ═══════════════════════════════════════════════════════════════════
// Registry
// ═══════════════════════════════════════════════════════════════════

const strategies = new Map<string, NavigationStrategy>();

function registerNavigationStrategy(name: string, strategy: NavigationStrategy): void {
    strategies.set(name, strategy);
}

// Register Defaults
registerNavigationStrategy('linear', resolveLinear);
registerNavigationStrategy('spatial', resolveSpatial);

// ═══════════════════════════════════════════════════════════════════
// Resolver Facade
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolves navigation using the strategy defined in config.orientation.
 * If no strategy matches, falls back to 'linear' or 'spatial' based on name.
 */
export function resolveWithStrategy(
    orientation: string,
    ...args: Parameters<NavigationStrategy>
): NavigateResult {
    // 1. Try exact match (e.g. 'grid-custom')
    let strategy = strategies.get(orientation);

    // 2. Fallback: Map known orientations to core strategies
    if (!strategy) {
        if (orientation === 'horizontal' || orientation === 'vertical') {
            strategy = strategies.get('linear');
        } else if (orientation === 'both') {
            strategy = strategies.get('spatial');
        }
    }

    if (strategy) {
        return strategy(...args);
    }

    // 3. Last Resort: No-op
    return { targetId: args[0], stickyX: null, stickyY: null };
}
