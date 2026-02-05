/**
 * Select Strategy - Single Selection
 * 
 * 단일 선택: 하나의 아이템만 선택 가능
 * - Enter/Space: 현재 포커스된 아이템 선택
 * - followFocus: 포커스 이동 시 자동 선택
 */

import { useFocusStore } from '@os/features/focus/store/focusStore';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface SingleSelectConfig {
    /** 포커스 이동 시 자동 선택 */
    followFocus?: boolean;
    /** 선택 해제 허용 여부 */
    allowDeselect?: boolean;
}

export interface SingleSelectResult {
    selectedId: string | null;
    changed: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Strategy
// ═══════════════════════════════════════════════════════════════════

/**
 * 단일 선택 처리
 */
export function selectSingle(
    targetId: string,
    currentSelection: string[],
    config: SingleSelectConfig = {}
): SingleSelectResult {
    const { allowDeselect = true } = config;

    const isAlreadySelected = currentSelection.includes(targetId);

    if (isAlreadySelected && allowDeselect) {
        return {
            selectedId: null,
            changed: true,
        };
    }

    if (isAlreadySelected) {
        return {
            selectedId: targetId,
            changed: false,
        };
    }

    return {
        selectedId: targetId,
        changed: true,
    };
}

/**
 * Follow Focus 선택 (포커스 이동 시 자동 선택)
 */
export function selectOnFocus(
    focusedId: string,
    config: SingleSelectConfig = {}
): SingleSelectResult {
    if (!config.followFocus) {
        return { selectedId: null, changed: false };
    }

    return {
        selectedId: focusedId,
        changed: true,
    };
}

/**
 * Store에 단일 선택 적용
 */
export function commitSingleSelection(targetId: string | null): void {
    const store = useFocusStore.getState();
    const selectionSlice = store as any;

    if (selectionSlice.setSelection) {
        selectionSlice.setSelection(targetId ? [targetId] : []);
    }
}
