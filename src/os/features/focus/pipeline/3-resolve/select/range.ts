/**
 * Select Strategy - Range Selection
 * 
 * 범위 선택: Shift+Arrow 또는 Shift+Enter
 * - Shift+방향키: anchor부터 현재까지 범위 선택
 * - anchor 자동 관리
 */

import { useFocusStore } from '@os/features/focus/store/focusStore';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface RangeSelectConfig {
    /** 범위 선택 허용 여부 */
    enabled?: boolean;
}

export interface RangeSelectResult {
    selection: string[];
    anchor: string;
    changed: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Strategy
// ═══════════════════════════════════════════════════════════════════

/**
 * 범위 선택 계산
 * anchor와 target 사이의 모든 아이템 선택
 */
export function selectRange(
    anchorId: string,
    targetId: string,
    allItems: string[],
    _config: RangeSelectConfig = {}
): RangeSelectResult {
    const anchorIndex = allItems.indexOf(anchorId);
    const targetIndex = allItems.indexOf(targetId);

    if (anchorIndex === -1 || targetIndex === -1) {
        return {
            selection: [],
            anchor: anchorId,
            changed: false,
        };
    }

    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);

    const selection = allItems.slice(start, end + 1);

    return {
        selection,
        anchor: anchorId,
        changed: true,
    };
}

/**
 * Anchor 설정 (새 선택 시작점)
 */
export function setSelectionAnchor(itemId: string): void {
    const store = useFocusStore.getState();
    const selectionSlice = store as any;

    if (selectionSlice.setSelectionAnchor) {
        selectionSlice.setSelectionAnchor(itemId);
    }
}

/**
 * Anchor 가져오기
 */
export function getSelectionAnchor(): string | null {
    const store = useFocusStore.getState();
    return (store as any).selectionAnchor || null;
}

/**
 * Shift+방향키 범위 확장
 */
export function extendRangeSelection(
    currentFocusId: string,
    direction: 'up' | 'down' | 'left' | 'right',
    allItems: string[],
    currentAnchor: string | null
): RangeSelectResult {
    const currentIndex = allItems.indexOf(currentFocusId);
    if (currentIndex === -1) {
        return { selection: [], anchor: currentFocusId, changed: false };
    }

    // anchor가 없으면 현재 위치를 anchor로
    const anchor = currentAnchor || currentFocusId;

    // 방향에 따라 target 계산
    let targetIndex = currentIndex;
    if (direction === 'down' || direction === 'right') {
        targetIndex = Math.min(currentIndex + 1, allItems.length - 1);
    } else {
        targetIndex = Math.max(currentIndex - 1, 0);
    }

    const targetId = allItems[targetIndex];

    return selectRange(anchor, targetId, allItems);
}

/**
 * Store에 범위 선택 적용
 */
export function commitRangeSelection(selection: string[], anchor: string): void {
    const store = useFocusStore.getState();
    const selectionSlice = store as any;

    if (selectionSlice.setSelection) {
        selectionSlice.setSelection(selection);
    }
    if (selectionSlice.setSelectionAnchor) {
        selectionSlice.setSelectionAnchor(anchor);
    }
}
