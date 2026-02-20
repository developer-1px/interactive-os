/**
 * OSState — OS Root State Schema
 *
 * OS 전체 상태를 표현하는 최상위 객체.
 * 각 서브시스템(focus, clipboard, window...)은 하위 필드로 존재하고,
 * effects는 모든 서브시스템이 공유하는 공통 배열이다.
 */

import type { EffectRecord, InputSource } from "../effect/EffectRecord.ts";
import type { FocusState } from "../focus/FocusState.ts";

/** Global single clipboard — one at a time, source-tagged for accept matching. */
export interface ClipboardState {
  /** Source collection identifier (appName:zoneName). null = empty. */
  source: string | null;
  /** Stored items (type-agnostic, collection owns interpretation). */
  items: unknown[];
  /** Was this a cut operation? */
  isCut: boolean;
}

export interface OSState {
  // ── Subsystem States ──

  /** 포커스 시스템 상태 */
  focus: FocusState;

  /** 클립보드 서브시스템 — 글로벌 단일 */
  clipboard: ClipboardState;

  // ── Shared Context ──

  /** 마지막 입력 소스 (모든 서브시스템이 참조) */
  inputSource: InputSource;

  // ── Effects (공통) ──

  /**
   * 커맨드 실행으로 발생한 모든 부작용.
   * 서브시스템 구분은 record.source 필드로 한다.
   * 커맨드 단위로 초기화된다 (transient).
   */
  effects: EffectRecord[];
}

export const INITIAL_OS_STATE: OSState = {
  focus: {
    activeZoneId: null,
    zone: null,
    focusStackDepth: 0,
  },
  clipboard: {
    source: null,
    items: [],
    isCut: false,
  },
  inputSource: "programmatic",
  effects: [],
};

