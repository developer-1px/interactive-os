/**
 * App Effects → Kernel Effects Bridge — Stub for Gap 3 Resolution
 *
 * 현재 앱 커맨드가 state.effects[] 배열에 push하는 패턴을
 * 커널의 defineEffect 기반으로 전환하기 위한 스텁.
 *
 * @status STUB — effect 타입별 kernel effect 매핑 설계 필요
 * @see docs/0-inbox/2026-02-11_Kernel_App_Migration_Gaps.md#gap-3
 *
 * 현재 앱이 사용하는 effect 타입:
 *   - FOCUS_ID: 특정 아이템에 포커스 이동
 *   - SCROLL_INTO_VIEW: 뷰포트로 스크롤
 *   - NAVIGATE: 방향 기반 네비게이션
 *
 * 목표:
 *   const FOCUS_ID = appGroup.defineEffect("focusId", (id: string) => {
 *     // DOM focus 이동
 *   });
 *
 *   // 커맨드에서:
 *   return { state: newState, focusId: targetId };
 *   // → 커널이 자동으로 FOCUS_ID effect 실행
 */

// TODO: 개밥먹기로 effect 패턴 검증 후 구현
export const APP_EFFECT_TYPES = [
    "FOCUS_ID",
    "SCROLL_INTO_VIEW",
    "NAVIGATE",
] as const;

export type AppEffectType = (typeof APP_EFFECT_TYPES)[number];
