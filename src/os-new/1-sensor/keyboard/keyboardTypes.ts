/**
 * [DEPRECATED] Re-export bridge — 기존 import 호환용.
 *
 * 새 코드에서는 개별 파일을 직접 import하세요:
 *   - KeyboardIntent.ts
 *   - KeyboardCategory.ts
 *   - KeyboardResolution.ts
 *   - KeyboardExecutionResult.ts
 */

export type { KeyboardCategory } from "./KeyboardCategory.ts";
export type { KeyboardExecutionResult } from "./KeyboardExecutionResult.ts";
export type { KeyboardIntent } from "./KeyboardIntent.ts";
export type {
  CommandResolution,
  FieldResolution,
  KeyboardResolution,
} from "./KeyboardResolution.ts";
