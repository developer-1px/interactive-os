/**
 * OS Command Schema — 커맨드 계층의 핵심 타입 정의
 *
 * re-export bridge: old 코드 타입을 new에서 사용.
 * Phase 4(스토어 통합) 이후 이 파일이 원본이 됨.
 */

// Command types
export type {
    OSCommand,
    OSContext,
    OSResult,
    DOMEffect,
    DOMQueries,
} from "../../features/focus/pipeline/core/osCommand";

// Config types
export type {
    Direction,
    Orientation,
    TabDirection,
    NavigateConfig,
    TabConfig,
    SelectConfig,
    ActivateConfig,
    DismissConfig,
    ProjectConfig,
    FocusGroupConfig,
} from "../../features/focus/types";

// Config defaults
export {
    DEFAULT_NAVIGATE,
    DEFAULT_TAB,
    DEFAULT_SELECT,
    DEFAULT_ACTIVATE,
    DEFAULT_DISMISS,
    DEFAULT_PROJECT,
    DEFAULT_CONFIG,
} from "../../features/focus/types";
