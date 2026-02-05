import type { Direction, NavigateConfig, FocusNode } from '../../../types';
import { DOMRegistry } from '../../../registry/DOMRegistry';

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

const resolveSpatial: NavigationStrategy = (currentId, direction, items, _config, spatial) => {
    if (!currentId) return { targetId: null, stickyX: null, stickyY: null };

    const currentEl = DOMRegistry.getItem(currentId);
    if (!currentEl) {
        return { targetId: currentId, stickyX: null, stickyY: null };
    }

    const currentRect = currentEl.getBoundingClientRect();

    const nodes: FocusNode[] = [];

    // Build node list with rects
    for (const id of items) {
        if (id === currentId) continue;
        const el = DOMRegistry.getItem(id);
        if (!el) {
            continue;
        }
        nodes.push({ id, element: el, rect: el.getBoundingClientRect() });
    }

    // Filter candidates in target direction with overlap check
    const candidates = nodes.filter((node) => {
        // Check overlap: for horizontal movement, must share vertical space
        // For vertical movement, must share horizontal space
        const verticalOverlap = node.rect.bottom > currentRect.top && node.rect.top < currentRect.bottom;
        const horizontalOverlap = node.rect.right > currentRect.left && node.rect.left < currentRect.right;

        let result = false;
        switch (direction) {
            case 'up':
                result = node.rect.bottom <= currentRect.top + 10 && horizontalOverlap;
                break;
            case 'down':
                result = node.rect.top >= currentRect.bottom - 10 && horizontalOverlap;
                break;
            case 'left':
                result = node.rect.right <= currentRect.left + 10 && verticalOverlap;
                break;
            case 'right':
                result = node.rect.left >= currentRect.right - 10 && verticalOverlap;
                break;
        }

        return result;
    });

    if (candidates.length === 0) {
        return { targetId: currentId, stickyX: spatial.stickyX, stickyY: spatial.stickyY };
    }

    // Use sticky position for alignment, or current center
    const anchorX = spatial.stickyX ?? (currentRect.left + currentRect.right) / 2;
    const anchorY = spatial.stickyY ?? (currentRect.top + currentRect.bottom) / 2;

    // Find best candidate
    let best = candidates[0];
    let bestScore = Infinity;

    for (const node of candidates) {
        const nodeX = (node.rect.left + node.rect.right) / 2;
        const nodeY = (node.rect.top + node.rect.bottom) / 2;

        // Score based on alignment with anchor
        const alignmentScore = direction === 'up' || direction === 'down'
            ? Math.abs(nodeX - anchorX)
            : Math.abs(nodeY - anchorY);

        // Distance score
        const distanceScore = direction === 'up' || direction === 'down'
            ? Math.abs(nodeY - currentRect.top)
            : Math.abs(nodeX - currentRect.left);

        const score = alignmentScore + distanceScore * 0.1;

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
