/**
 * FocusOrchestrator - Cross-Zone Navigation Manager
 * 
 * Logic for moving focus between zones (Tab flow, Escape).
 * Encapsulates FocusRegistry interactions.
 */

import { FocusRegistry } from '../registry/FocusRegistry.ts';
import { updateEntry } from '../pipeline/3-update/updateEntry.ts';

export const FocusOrchestrator = {
    /**
     * Move focus to the next/previous sibling zone.
     */
    traverseZone: (
        currentZoneId: string,
        direction: 'forward' | 'backward',
        fallbackConfig?: any // Optional config to use if target zone is missing one
    ): boolean => {
        const nextZoneId = FocusRegistry.getSiblingZone(direction);

        if (!nextZoneId) {
            console.warn('[FocusOrchestrator] No sibling zone found for', { currentZoneId, direction });
            return false;
        }

        const nextZoneEntry = FocusRegistry.getZoneEntry(nextZoneId);
        if (!nextZoneEntry || !nextZoneEntry.store) {
            console.warn('[FocusOrchestrator] Target zone entry invalid', { nextZoneId });
            return false;
        }

        const { store: nextZoneStore, config: nextZoneConfig } = nextZoneEntry;

        // 1. Activate the target zone
        FocusRegistry.setActiveZone(nextZoneId);

        // 2. Determine entry item
        const nextState = nextZoneStore.getState();
        const items = nextState.items;

        if (items.length > 0) {
            // Use target zone's navigate config for entry, or fallback
            // We assume 'navigate' config is what controls entry, 
            // but actually 'entry' is a top-level or navigate-level property depending on types.
            // Let's assume passed config has access to it.
            // Actually, updateEntry takes NavigateConfig.

            const entryConfig = nextZoneConfig?.navigate || fallbackConfig?.navigate;

            if (entryConfig) {
                const targetItem = updateEntry(items, entryConfig, {
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
