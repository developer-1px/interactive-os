/**
 * Select Strategy - Multiple Selection
 * 
 * 다중 선택: Ctrl+Enter로 토글
 * - Ctrl+Enter/Space: 선택 토글
 * - 기존 선택 유지하면서 추가/제거
 */

import { useFocusStore } from '@os/features/focus/store/focusStore';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface MultipleSelectConfig {
    /** 최대 선택 가능 수 (0 = 무제한) */
    maxCount?: number;
    /** 최소 선택 필수 수 */
    minCount?: number;
}

export interface MultipleSelectResult {
    selection: string[];
    added: string[];
    removed: string[];
    changed: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Strategy
// ═══════════════════════════════════════════════════════════════════

/**
 * 다중 선택 토글
 */
export function toggleSelection(
    targetId: string,
    currentSelection: string[],
    config: MultipleSelectConfig = {}
): MultipleSelectResult {
    const { maxCount = 0, minCount = 0 } = config;

    const isSelected = currentSelection.includes(targetId);

    if (isSelected) {
        // 제거 시도
        if (currentSelection.length <= minCount) {
            return {
                selection: currentSelection,
                added: [],
                removed: [],
                changed: false,
            };
        }

        const newSelection = currentSelection.filter(id => id !== targetId);
        return {
            selection: newSelection,
            added: [],
            removed: [targetId],
            changed: true,
        };
    } else {
        // 추가 시도
        if (maxCount > 0 && currentSelection.length >= maxCount) {
            return {
                selection: currentSelection,
                added: [],
                removed: [],
                changed: false,
            };
        }

        const newSelection = [...currentSelection, targetId];
        return {
            selection: newSelection,
            added: [targetId],
            removed: [],
            changed: true,
        };
    }
}

/**
 * 전체 선택
 */
export function selectAll(
    allIds: string[],
    config: MultipleSelectConfig = {}
): MultipleSelectResult {
    const { maxCount = 0 } = config;

    const selection = maxCount > 0 ? allIds.slice(0, maxCount) : allIds;

    return {
        selection,
        added: selection,
        removed: [],
        changed: selection.length > 0,
    };
}

/**
 * 전체 선택 해제
 */
export function deselectAll(
    currentSelection: string[],
    config: MultipleSelectConfig = {}
): MultipleSelectResult {
    const { minCount = 0 } = config;

    if (minCount > 0) {
        return {
            selection: currentSelection.slice(0, minCount),
            added: [],
            removed: currentSelection.slice(minCount),
            changed: currentSelection.length > minCount,
        };
    }

    return {
        selection: [],
        added: [],
        removed: currentSelection,
        changed: currentSelection.length > 0,
    };
}

/**
 * Store에 다중 선택 적용
 */
export function commitMultipleSelection(selection: string[]): void {
    const store = useFocusStore.getState();
    const selectionSlice = store as any;

    if (selectionSlice.setSelection) {
        selectionSlice.setSelection(selection);
    }
}
