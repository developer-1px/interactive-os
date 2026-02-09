/**
 * OSState — OS Root State Schema
 *
 * OS 전체 상태를 표현하는 최상위 객체.
 * 각 서브시스템(focus, clipboard, window...)은 하위 필드로 존재하고,
 * effects는 모든 서브시스템이 공유하는 공통 배열이다.
 *
 * 이 스키마는 어디에도 직접 저장되지 않는다.
 * Analyzer가 로그 또는 런타임 상태에서 조합하여 구성한다.
 */

import type { EffectRecord, InputSource } from "./effects";
import type { FocusState } from "./focus";

// ═══════════════════════════════════════════════════════════════════
// Root State
// ═══════════════════════════════════════════════════════════════════

export interface OSState {
    // ── Subsystem States ──

    /** 포커스 시스템 상태 */
    focus: FocusState;

    // Future subsystems:
    // clipboard: ClipboardState;
    // window: WindowState;
    // audio: AudioState;

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

// ═══════════════════════════════════════════════════════════════════
// Initial State
// ═══════════════════════════════════════════════════════════════════

export const INITIAL_OS_STATE: OSState = {
    focus: {
        activeZoneId: null,
        zone: null,
        focusStackDepth: 0,
    },
    inputSource: "programmatic",
    effects: [],
};
