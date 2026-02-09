/**
 * Navigator Registry — strategy dispatcher for within-zone navigation.
 *
 * Pure function — no DOM access. Rects are passed in via the spatial parameter.
 */

import type { Direction, NavigateConfig } from "../../schema";
import { resolveCorner } from "./cornerNav.ts";
import { findBestCandidate, type FocusCandidate } from "./focusFinder.ts";
import { resolveEntry } from "./entry.ts";

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
    spatial: {
        stickyX: number | null;
        stickyY: number | null;
        /** Item rects for spatial strategies — injected by caller */
        itemRects?: Map<string, DOMRect>;
    },
) => NavigateResult;

// ═══════════════════════════════════════════════════════════════════
// Linear Strategy (pure)
// ═══════════════════════════════════════════════════════════════════

const resolveLinear: NavigationStrategy = (
    currentId,
    direction,
    items,
    config,
) => {
    if (!currentId) return { targetId: items[0], stickyX: null, stickyY: null };

    const idx = items.indexOf(currentId);
    if (idx === -1) return { targetId: items[0], stickyX: null, stickyY: null };

    if (direction === "home") {
        return { targetId: items[0], stickyX: null, stickyY: null };
    }
    if (direction === "end") {
        return {
            targetId: items[items.length - 1],
            stickyX: null,
            stickyY: null,
        };
    }

    const isForward = direction === "down" || direction === "right";
    const delta = isForward ? 1 : -1;
    let nextIndex = idx + delta;

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

// ═══════════════════════════════════════════════════════════════════
// Spatial Strategy (pure — uses itemRects from spatial param)
// ═══════════════════════════════════════════════════════════════════

const resolveSpatial: NavigationStrategy = (
    currentId,
    direction,
    items,
    _config,
    spatial,
) => {
    if (!currentId) return { targetId: null, stickyX: null, stickyY: null };

    const itemRects = spatial.itemRects;
    if (!itemRects) {
        return { targetId: currentId, stickyX: null, stickyY: null };
    }

    const currentRect = itemRects.get(currentId);
    if (!currentRect) {
        return { targetId: currentId, stickyX: null, stickyY: null };
    }

    // Build candidate list from provided rects
    const candidates: FocusCandidate[] = [];
    for (const id of items) {
        if (id === currentId) continue;
        const rect = itemRects.get(id);
        if (!rect) continue;
        candidates.push({ id, rect });
    }

    if (candidates.length === 0) {
        return { targetId: currentId, stickyX: null, stickyY: null };
    }

    if (direction === "home" || direction === "end") {
        return { targetId: currentId, stickyX: null, stickyY: null };
    }

    const best = findBestCandidate(currentRect, direction, candidates);

    if (!best) {
        return {
            targetId: currentId,
            stickyX: spatial.stickyX,
            stickyY: spatial.stickyY,
        };
    }

    const currentCenterX = (currentRect.left + currentRect.right) / 2;
    const currentCenterY = (currentRect.top + currentRect.bottom) / 2;
    const anchorX = spatial.stickyX ?? currentCenterX;
    const anchorY = spatial.stickyY ?? currentCenterY;

    const newStickyX =
        direction === "up" || direction === "down" ? anchorX : null;
    const newStickyY =
        direction === "left" || direction === "right" ? anchorY : null;

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

function registerNavigationStrategy(
    name: string,
    strategy: NavigationStrategy,
): void {
    strategies.set(name, strategy);
}

registerNavigationStrategy("linear", resolveLinear);
registerNavigationStrategy("spatial", resolveSpatial);
registerNavigationStrategy("corner", resolveCorner);

// ═══════════════════════════════════════════════════════════════════
// Resolver Facade
// ═══════════════════════════════════════════════════════════════════

export function resolveWithStrategy(
    orientation: string,
    ...args: Parameters<NavigationStrategy>
): NavigateResult {
    let strategy = strategies.get(orientation);

    if (!strategy) {
        if (orientation === "horizontal" || orientation === "vertical") {
            strategy = strategies.get("linear");
        } else if (orientation === "both") {
            strategy = strategies.get("spatial");
        } else if (orientation === "corner") {
            strategy = strategies.get("corner");
        }
    }

    if (strategy) {
        return strategy(...args);
    }

    return { targetId: args[0], stickyX: null, stickyY: null };
}
