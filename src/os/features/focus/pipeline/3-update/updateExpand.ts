/**
 * Update Expand - Handles EXPAND intent for tree/accordion items
 */

import type { FocusGroupStore } from '../../store/focusGroupStore';

export type ExpandAction = 'toggle' | 'expand' | 'collapse';

export interface ExpandResult {
    changed: boolean;
    newExpanded: boolean;
}

export function updateExpand(
    store: FocusGroupStore,
    targetId: string,
    action: ExpandAction
): ExpandResult {
    const state = store.getState();
    const isCurrentlyExpanded = state.expandedItems.includes(targetId);

    let newExpanded: boolean;

    switch (action) {
        case 'expand':
            newExpanded = true;
            break;
        case 'collapse':
            newExpanded = false;
            break;
        case 'toggle':
        default:
            newExpanded = !isCurrentlyExpanded;
            break;
    }

    if (newExpanded !== isCurrentlyExpanded) {
        state.setExpanded(targetId, newExpanded);
        return { changed: true, newExpanded };
    }

    return { changed: false, newExpanded: isCurrentlyExpanded };
}
