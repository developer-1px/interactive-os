/**
 * Pipeline - Commit Phase
 * 
 * Store update - applies resolved target to the store
 */

import type { ResolvedTarget } from './resolve';
import { useFocusStore } from '@os/features/focus/store/focusStore';

// ═══════════════════════════════════════════════════════════════════
// Commit Result
// ═══════════════════════════════════════════════════════════════════

export interface CommitResult {
    success: boolean;
    focusedItemId: string | null;
    activeZoneId: string | null;
    selection: string[];
}

// ═══════════════════════════════════════════════════════════════════
// Commit Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Commit resolved target to store
 * Returns the committed state
 */
export function commitToStore(target: ResolvedTarget): CommitResult {
    const store = useFocusStore.getState();

    // Update focused item
    if (target.shouldFocus && target.targetItemId) {
        store.setFocus(target.targetItemId, {
            id: target.targetItemId,
            index: 0, // Will be updated by Item component
            payload: null,
            group: { id: target.targetZoneId || '' }
        });
    }

    // Update selection
    if (target.newSelection !== undefined) {
        const selectionSlice = store as any; // Selection slice
        if (selectionSlice.setSelection) {
            selectionSlice.setSelection(target.newSelection);
        }
    }

    return {
        success: true,
        focusedItemId: target.targetItemId,
        activeZoneId: target.targetZoneId,
        selection: target.newSelection || [],
    };
}

/**
 * Batch commit multiple changes
 */
export function commitBatch(targets: ResolvedTarget[]): CommitResult[] {
    return targets.map(commitToStore);
}
