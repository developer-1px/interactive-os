/**
 * ZoneOrchestrator - Cross-Zone Navigation Manager
 * 
 * Logic for moving focus between zones (Tab flow, Escape).
 * Encapsulates GlobalZoneRegistry interactions.
 */

import { GlobalZoneRegistry } from '../registry/GlobalZoneRegistry';
import { resolveEntry } from './3-resolve/resolveEntry';

export const ZoneOrchestrator = {
    /**
     * Move focus to the next/previous sibling zone.
     */
    traverseZone: (
        currentZoneId: string,
        direction: 'forward' | 'backward',
        fallbackConfig?: any // Optional config to use if target zone is missing one
    ): boolean => {
        const nextZoneId = GlobalZoneRegistry.getSiblingZone(direction);

        if (!nextZoneId) {
            console.warn('[ZoneOrchestrator] No sibling zone found for', { currentZoneId, direction });
            return false;
        }

        const nextZoneEntry = GlobalZoneRegistry.getZoneEntry(nextZoneId);
        if (!nextZoneEntry || !nextZoneEntry.store) {
            console.warn('[ZoneOrchestrator] Target zone entry invalid', { nextZoneId });
            return false;
        }

        const { store: nextZoneStore, config: nextZoneConfig } = nextZoneEntry;

        // 1. Activate the target zone
        GlobalZoneRegistry.setActiveZone(nextZoneId);

        // 2. Determine entry item
        const nextState = nextZoneStore.getState();
        const items = nextState.items;

        if (items.length > 0) {
            // Use target zone's navigate config for entry, or fallback
            // We assume 'navigate' config is what controls entry, 
            // but actually 'entry' is a top-level or navigate-level property depending on types.
            // Let's assume passed config has access to it.
            // Actually, resolveEntry takes NavigateConfig.

            const entryConfig = nextZoneConfig?.navigate || fallbackConfig?.navigate;

            if (entryConfig) {
                const targetItem = resolveEntry(items, entryConfig, {
                    lastFocusedId: nextState.lastFocusedId,
                    selection: nextState.selection,
                });

                if (targetItem) {
                    nextZoneStore.setState({ focusedItemId: targetItem });
                    // TODO: Commit selection if 'followFocus' is true in target?
                    // Ideally we should use commitAll on target store.
                    return true;
                }
            }
        } else {
            // Empty zone focused?
            nextZoneStore.setState({ focusedItemId: null });
            return true;
        }

        return false;
    }
};
