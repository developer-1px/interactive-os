/**
 * FocusState — 포커스 서브시스템 상태
 *
 * OSState.focus에 위치하는 포커스 전용 상태.
 * inputSource와 effects는 OS Root에서 관리한다.
 */

export interface ZoneSnapshot {
    id: string;
    focusedItemId: string | null;
    selection: string[];
    selectionAnchor: string | null;
    expandedItems: string[];
    stickyX: number | null;
    stickyY: number | null;
    recoveryTargetId: string | null;
}

export interface FocusState {
    /** 현재 활성 Zone ID */
    activeZoneId: string | null;

    /** 활성 Zone의 상태 스냅샷 */
    zone: ZoneSnapshot | null;

    /** Focus Stack 깊이 */
    focusStackDepth: number;
}
