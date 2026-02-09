export type InputSource = "mouse" | "keyboard" | "programmatic";

export type EffectSource = "focus";

export type FocusEffectAction = "focus" | "scrollIntoView" | "blur" | "click";

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

/** Focus 서브시스템 전용 EffectRecord 생성 헬퍼 */
export function createFocusEffect(
  action: FocusEffectAction,
  targetId: string | null,
  executed: boolean,
  reason?: string,
): EffectRecord {
  return { source: "focus", action, targetId, executed, reason };
}
