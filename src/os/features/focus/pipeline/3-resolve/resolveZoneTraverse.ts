/**
 * resolveZoneTraverse - Calculate next zone for Tab navigation
 * 
 * Pipeline Phase 3: UPDATE
 * Pure function - no side effects, no state mutations.
 * Returns the resolved target zone and item, or null if no valid target.
 */

import type { NavigateConfig } from '../../types';
import { resolveEntry } from './resolveEntry';

export interface ZoneTraverseContext {
    /** Get sibling zone in direction */
    getSiblingGroupId: (direction: 'forward' | 'backward') => string | null;
    /** Get zone entry by ID */
    getGroupEntry: (id: string) => {
        store: { getState: () => { lastFocusedId: string | null; selection: string[] } };
        config?: { navigate?: NavigateConfig };
    } | undefined;
    /** Get DOM-based items for a zone */
    getGroupItems: (id: string) => string[];
}

export interface ZoneTraverseResult {
    /** Target zone ID */
    targetGroupId: string;
    /** Target item ID within the zone (null if empty zone) */
    targetItemId: string | null;
    /** The store to commit changes to */
    targetStore: any;
}

/**
 * Calculate the next zone and entry item for Tab-based navigation.
 * 
 * @param direction - forward or backward
 * @param fallbackConfig - Optional config to use if target zone is missing one
 * @param context - Registry access functions (injected for testability)
 * @returns Result with target zone/item, or null if no valid target
 */
export function resolveZoneTraverse(
    direction: 'forward' | 'backward',
    fallbackConfig: { navigate?: NavigateConfig } | undefined,
    context: ZoneTraverseContext
): ZoneTraverseResult | null {
    // 1. Find sibling zone
    const nextGroupId = context.getSiblingGroupId(direction);
    if (!nextGroupId) {
        return null;
    }

    // 2. Get zone entry
    const nextEntry = context.getGroupEntry(nextGroupId);
    if (!nextEntry || !nextEntry.store) {
        return null;
    }

    const { store: nextStore, config: nextConfig } = nextEntry;
    const nextState = nextStore.getState();

    // Use DOM-based items instead of store items
    const items = context.getGroupItems(nextGroupId);

    // 3. Calculate entry item
    if (items.length === 0) {
        // Empty zone
        return {
            targetGroupId: nextGroupId,
            targetItemId: null,
            targetStore: nextStore,
        };
    }

    // Use target zone's navigate config for entry, or fallback
    const entryConfig = nextConfig?.navigate || fallbackConfig?.navigate;

    if (entryConfig) {
        const targetItem = resolveEntry(items, entryConfig, {
            lastFocusedId: nextState.lastFocusedId,
            selection: nextState.selection,
        });

        return {
            targetGroupId: nextGroupId,
            targetItemId: targetItem,
            targetStore: nextStore,
        };
    }

    // No config - default to first item
    return {
        targetGroupId: nextGroupId,
        targetItemId: items[0],
        targetStore: nextStore,
    };
}
