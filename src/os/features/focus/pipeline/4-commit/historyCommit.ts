/**
 * History Commit
 * 
 * Focus history 스택 관리 (Zone History)
 */

import { useFocusStore } from '@os/features/focus/store/focusStore';

// ═══════════════════════════════════════════════════════════════════
// Commit Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Escape로 이전 zone으로 돌아가기
 * (ZoneSlice의 setActiveZone이 내부적으로 history를 사용하여 처리할 수도 있지만,
 *  여기서는 명시적으로 history를 pop하여 이동하는 로직을 구현할 수 있음)
 */
export function restorePreviousZone(): boolean {
    const store = useFocusStore.getState();
    const zoneSlice = store as any;

    if (!zoneSlice.history || zoneSlice.history.length === 0) {
        return false;
    }

    // 가장 최근 zone으로 이동 (현재 activeZoneId는 이미 history에 push 되어있을 수 있으므로 주의)
    // ZoneSlice 구현상 history[0]이 바로 이전 zone id임
    const previousZoneId = zoneSlice.history[0];

    if (previousZoneId && zoneSlice.setActiveZone) {
        zoneSlice.setActiveZone(previousZoneId);
        return true;
    }

    return false;
}

/**
 * 현재 history 스택 조회
 */
export function getHistoryStack(): string[] {
    const store = useFocusStore.getState();
    const zoneSlice = store as any;

    return zoneSlice.history || [];
}

