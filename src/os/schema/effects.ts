/**
 * EffectRecord — OS 공통 부작용 스키마
 *
 * 모든 OS 서브시스템(focus, clipboard, window, audio...)이
 * 동일한 형태로 effect를 기록한다.
 *
 * Effect는 "실행된 부작용의 기록"이다. 데이터로 존재하며,
 * executed/reason으로 실행 여부까지 추적한다.
 */

// ═══════════════════════════════════════════════════════════════════
// Input Source — OS 공통 입력 소스
// ═══════════════════════════════════════════════════════════════════

export type InputSource = "mouse" | "keyboard" | "programmatic";

// ═══════════════════════════════════════════════════════════════════
// Effect Record — 부작용도 데이터
// ═══════════════════════════════════════════════════════════════════

export interface EffectRecord {
  /** 어떤 서브시스템이 생성한 effect인가 */
  source: EffectSource;

  /** 구체적 동작 */
  action: string;

  /** 대상 element/resource ID (없을 수 있음) */
  targetId: string | null;

  /** 실행 여부 */
  executed: boolean;

  /** 스킵된 이유 (executed: false일 때) */
  reason?: string;
}

export type EffectSource = "focus"; // 포커스 시스템 (focus, scrollIntoView, blur, click)
// Future subsystems:
// | "clipboard"  // 클립보드 (copy, paste, cut)
// | "window"     // 윈도우 (open, close, resize)
// | "audio"      // 오디오 (play, stop)

// ═══════════════════════════════════════════════════════════════════
// Focus Effect Actions (타입 안전한 action 제한)
// ═══════════════════════════════════════════════════════════════════

export type FocusEffectAction = "focus" | "scrollIntoView" | "blur" | "click";

/** Focus 서브시스템 전용 EffectRecord 생성 헬퍼 */
export function createFocusEffect(
  action: FocusEffectAction,
  targetId: string | null,
  executed: boolean,
  reason?: string,
): EffectRecord {
  return { source: "focus", action, targetId, executed, reason };
}
