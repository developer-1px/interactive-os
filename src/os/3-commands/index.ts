/**
 * OS Commands — Barrel export
 *
 * All kernel-based OS commands.
 * Folder structure mirrors official/os/why-*.md documents.
 */

// Clipboard
export { OS_COPY, OS_CUT, OS_PASTE } from "./clipboard/clipboard";
// Dismiss
export { ESCAPE } from "./dismiss";
// Expansion
export { EXPAND } from "./expand";
// Field
export {
  FIELD_CANCEL,
  FIELD_COMMIT,
  FIELD_START_EDIT,
} from "./field/field";
// Focus
export { FOCUS, RECOVER, STACK_POP, STACK_PUSH, SYNC_FOCUS } from "./focus";
// Interaction (delegates: activate, check, delete, move, undo, redo)
export {
  ACTIVATE,
  OS_CHECK,
  OS_DELETE,
  OS_MOVE_DOWN,
  OS_MOVE_UP,
  OS_REDO,
  OS_UNDO,
} from "./interaction";
// Navigation
export { NAVIGATE } from "./navigate";
// Overlay
export { OVERLAY_CLOSE, OVERLAY_OPEN } from "./overlay/overlay";
// Selection
export {
  OS_SELECT_ALL,
  SELECT,
  SELECTION_ADD,
  SELECTION_CLEAR,
  SELECTION_REMOVE,
  SELECTION_SET,
  SELECTION_TOGGLE,
} from "./selection";
// Tab
export { TAB } from "./tab";
