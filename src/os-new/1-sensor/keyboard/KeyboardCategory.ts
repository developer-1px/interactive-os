/**
 * KeyboardCategory — 키보드 파이프라인 Phase 2 (Classify) 출력
 */
export type KeyboardCategory =
  | "COMMAND" // Matched a keybinding (includes navigation)
  | "FIELD" // Input within a Field
  | "PASSTHRU"; // Let browser handle
