/**
 * OS_COMMANDS — OS 표준 커맨드 ID 상수
 *
 * Interactive OS가 인식하는 well-known command IDs.
 * Apps는 이 커맨드들을 구현하여 통합 인터랙션 스트림에 참여한다.
 */
export const OS_COMMANDS = {
  // --- Navigation (The "Physics" of Focus) ---
  OS_NAVIGATE: "OS_NAVIGATE",
  OS_FOCUS: "OS_FOCUS",
  OS_SYNC_FOCUS: "OS_SYNC_FOCUS",
  OS_TAB: "OS_TAB",
  TAB_PREV: "OS_TAB_PREV",

  // --- Selection (The "Selection" of Items) ---
  OS_SELECT: "OS_SELECT",
  SELECT_ALL: "OS_SELECT_ALL",
  DESELECT_ALL: "OS_DESELECT_ALL",

  // --- Activation (The "Action" Trigger) ---
  OS_ACTIVATE: "OS_ACTIVATE",

  // --- Escape (Context-aware: deselect, close, or none) ---
  OS_ESCAPE: "OS_ESCAPE",

  // --- Field Editing (The "Edit" Lifecycle) ---
  OS_FIELD_START_EDIT: "OS_FIELD_START_EDIT",
  OS_FIELD_COMMIT: "OS_FIELD_COMMIT",
  OS_FIELD_CANCEL: "OS_FIELD_CANCEL",
  FIELD_SYNC: "OS_FIELD_SYNC",
  FIELD_BLUR: "OS_FIELD_BLUR",

  // --- Clipboard (The "Data" Transfer) ---
  COPY: "OS_COPY",
  CUT: "OS_CUT",
  PASTE: "OS_PASTE",

  // --- Editing (The "Modification" Actions) ---
  TOGGLE: "OS_TOGGLE",
  DELETE: "OS_DELETE",

  // --- History (The "Time" Control) ---
  UNDO: "OS_UNDO",
  REDO: "OS_REDO",

  // --- Window/Shell (The "Desktop" Layer) ---
  TOGGLE_INSPECTOR: "OS_TOGGLE_INSPECTOR",
} as const;

export type OSCommandType = (typeof OS_COMMANDS)[keyof typeof OS_COMMANDS];
