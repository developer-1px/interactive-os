/**
 * Selection Commit
 * 
 * Selection 상태를 store에 커밋
 */

import { useFocusStore } from '@os/features/focus/store/focusStore';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface SelectionCommitResult {
    success: boolean;
    previousSelection: string[];
    newSelection: string[];
}

// ═══════════════════════════════════════════════════════════════════
// Commit Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Selection 상태 커밋
 */
export function commitSelection(newSelection: string[]): SelectionCommitResult {
    const store = useFocusStore.getState();
    const selectionSlice = store as any;

    const previousSelection = selectionSlice.selection || [];

    if (selectionSlice.setSelection) {
        selectionSlice.setSelection(newSelection);
    }

    return {
        success: true,
        previousSelection,
        newSelection,
    };
}

/**
 * Selection anchor 커밋
 */
export function commitSelectionAnchor(anchor: string | null): void {
    const store = useFocusStore.getState();
    const selectionSlice = store as any;

    if (selectionSlice.setSelectionAnchor) {
        selectionSlice.setSelectionAnchor(anchor);
    }
}

/**
 * Selection 토글 커밋
 */
export function commitToggleSelection(targetId: string): SelectionCommitResult {
    const store = useFocusStore.getState();
    const selectionSlice = store as any;

    const currentSelection: string[] = selectionSlice.selection || [];
    const isSelected = currentSelection.includes(targetId);

    const newSelection = isSelected
        ? currentSelection.filter(id => id !== targetId)
        : [...currentSelection, targetId];

    if (selectionSlice.setSelection) {
        selectionSlice.setSelection(newSelection);
    }

    return {
        success: true,
        previousSelection: currentSelection,
        newSelection,
    };
}

/**
 * Selection 클리어
 */
export function commitClearSelection(): SelectionCommitResult {
    const store = useFocusStore.getState();
    const selectionSlice = store as any;

    const previousSelection: string[] = selectionSlice.selection || [];

    if (selectionSlice.setSelection) {
        selectionSlice.setSelection([]);
    }
    if (selectionSlice.setSelectionAnchor) {
        selectionSlice.setSelectionAnchor(null);
    }

    return {
        success: true,
        previousSelection,
        newSelection: [],
    };
}
