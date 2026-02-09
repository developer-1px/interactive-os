/**
 * KeyboardResolution — 키보드 파이프라인 Phase 3 (Resolve) 출력
 */

export interface CommandResolution {
  type: "COMMAND";
  commandId: string;
  args?: Record<string, unknown>;
  source: "app" | "os";
}

export interface FieldResolution {
  type: "FIELD";
  action: "START_EDIT" | "COMMIT" | "CANCEL" | "SYNC";
  fieldId: string;
}

export type KeyboardResolution = CommandResolution | FieldResolution | null;
