/**
 * commitFocus - State commitment actions
 * 
 * Phase 4: COMMIT
 * Applies resolved state changes to the store.
 * 
 * SINGLE RESPONSIBILITY:
 * This module is the ONLY place where valid state transitions are applied.
 * It does not contain logic, only mutations to the passed store.
 * NO external side effects - only mutates the store parameter.
 */

import type { FocusZoneStore } from '../../store/focusZoneStore';

export interface CommitPayload {
    targetId?: string | null;
    stickyX?: number | null;
    stickyY?: number | null;
    selection?: string[];
    anchor?: string | null;
}

/**
 * Standardized Commit Point
 * All resolved changes must pass through here.
 * Pure store mutation - no external dependencies.
 */
export function commitAll(store: FocusZoneStore, payload: CommitPayload): void {
    const state = store.getState();
    const { targetId, stickyX, stickyY, selection, anchor } = payload;

    if (targetId !== undefined && targetId !== state.focusedItemId) {
        state.setFocus(targetId);
    }

    if (stickyX !== undefined || stickyY !== undefined) {
        state.setSpatialSticky(stickyX ?? state.stickyX, stickyY ?? state.stickyY);
    }

    if (selection !== undefined) {
        const isSame = selection.length === state.selection.length &&
            selection.every((id, i) => id === state.selection[i]);
        if (!isSame) state.setSelection(selection);
    }

    if (anchor !== undefined && anchor !== state.selectionAnchor) {
        state.setSelectionAnchor(anchor);
    }
}
