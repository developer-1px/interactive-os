/**
 * updateTab - Tab key behavior logic
 * 
 * Phase 3: RESOLVE (Tab)
 * Handles trap/escape/flow behaviors.
 */

import type { TabDirection, TabConfig } from '../../types';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface TabResult {
    action: 'trap' | 'escape' | 'flow';
    targetId: string | null;
}

// ═══════════════════════════════════════════════════════════════════
// Main Resolver
// ═══════════════════════════════════════════════════════════════════

export function updateTab(
    currentId: string | null,
    direction: TabDirection,
    items: string[],
    config: TabConfig
): TabResult {
    switch (config.behavior) {
        case 'trap':
            return resolveTrap(currentId, direction, items);

        case 'escape':
            return { action: 'escape', targetId: null };

        case 'flow':
        default:
            return { action: 'flow', targetId: null };
    }
}

// ═══════════════════════════════════════════════════════════════════
// Trap Behavior (Loop within zone)
// ═══════════════════════════════════════════════════════════════════

function resolveTrap(
    currentId: string | null,
    direction: TabDirection,
    items: string[]
): TabResult {
    if (items.length === 0) {
        return { action: 'trap', targetId: null };
    }

    if (!currentId) {
        return {
            action: 'trap',
            targetId: direction === 'forward' ? items[0] : items[items.length - 1],
        };
    }

    const currentIndex = items.indexOf(currentId);
    if (currentIndex === -1) {
        return { action: 'trap', targetId: items[0] };
    }

    const delta = direction === 'forward' ? 1 : -1;
    let nextIndex = currentIndex + delta;

    // Loop at boundaries
    if (nextIndex < 0) {
        nextIndex = items.length - 1;
    } else if (nextIndex >= items.length) {
        nextIndex = 0;
    }

    return {
        action: 'trap',
        targetId: items[nextIndex],
    };
}
