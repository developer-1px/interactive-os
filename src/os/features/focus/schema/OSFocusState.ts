/**
 * OS Focus State Schema — 통합 상태 모델
 *
 * OS 포커스 시스템의 전체 상태를 하나의 스냅샷으로 표현한다.
 * State(데이터)와 Effects(부작용)는 같은 구조체의 다른 필드다.
 *
 * 이 스키마 자체는 어디에도 저장되지 않는다.
 * Analyzer가 로그를 읽어 재구성하거나, 현재 상태를 직접 읽어 구성한다.
 */

// ═══════════════════════════════════════════════════════════════════
// Effect Record — 부작용도 데이터
// ═══════════════════════════════════════════════════════════════════

export interface EffectRecord {
  /** DOM 조작 종류 */
  action: "focus" | "scrollIntoView" | "blur" | "click";

  /** 대상 element ID (blur는 null) */
  targetId: string | null;

  /** 실행 여부 (마우스 클릭 시 scroll 스킵 등) */
  executed: boolean;

  /** 스킵된 이유 (executed: false일 때) */
  reason?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Zone State — Zone 단위 상태
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
// OS Focus State — 통합 스냅샷
// ═══════════════════════════════════════════════════════════════════

export interface OSFocusState {
  // ── State: 순수 데이터 ──

  /** 현재 활성 Zone ID */
  activeZoneId: string | null;

  /** 활성 Zone의 상태 스냅샷 */
  zone: ZoneSnapshot | null;

  /** Focus Stack 깊이 */
  focusStackDepth: number;

  /** 마지막 입력 소스 */
  inputSource: "mouse" | "keyboard" | "programmatic";

  // ── Effects: 부작용도 데이터 ──

  /** 이 커맨드가 생성한 DOM effects */
  effects: EffectRecord[];
}

// ═══════════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════════

export const INITIAL_OS_FOCUS_STATE: OSFocusState = {
  activeZoneId: null,
  zone: null,
  focusStackDepth: 0,
  inputSource: "programmatic",
  effects: [],
};
