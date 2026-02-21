/**
 * OS Commands — Barrel export
 *
 * All kernel-based OS commands.
 * Folder structure mirrors official/os/why-*.md documents.
 */

// Clipboard
export { OS_COPY, OS_CUT, OS_PASTE } from "./clipboard/clipboard";
// Dismiss
export { OS_ESCAPE } from "./dismiss";
// Expansion
export { OS_EXPAND } from "./expand";
// Field
export {
  OS_FIELD_CANCEL,
  OS_FIELD_COMMIT,
  OS_FIELD_START_EDIT,
} from "./field/field";
// Focus
export {
  OS_FOCUS,
  OS_STACK_POP,
  OS_STACK_PUSH,
  OS_SYNC_FOCUS,
} from "./focus";
// Interaction (delegates: activate, check, delete, move, undo, redo)
export {
  OS_ACTIVATE,
  OS_CHECK,
  OS_DELETE,
  OS_MOVE_DOWN,
  OS_MOVE_UP,
  OS_REDO,
  OS_UNDO,
} from "./interaction";
// Navigation
export { OS_NAVIGATE } from "./navigate";
// Overlay
export { OS_OVERLAY_CLOSE, OS_OVERLAY_OPEN } from "./overlay/overlay";
// Selection
export {
  OS_SELECT,
  OS_SELECT_ALL,
  OS_SELECTION_ADD,
  OS_SELECTION_CLEAR,
  OS_SELECTION_REMOVE,
  OS_SELECTION_SET,
  OS_SELECTION_TOGGLE,
} from "./selection";
// Tab
export { OS_TAB } from "./tab";
