/**
 * OS Commands - Pure functions for focus management
 *
 * Each command:
 * - Takes OSContext (read snapshot)
 * - Returns OSResult (state + effects)
 * - No side effects
 *
 * Note: Clipboard (COPY/CUT/PASTE) → @os/features/clipboard/
 *       History (UNDO/REDO) → @os/features/history/
 */

export { ACTIVATE } from "./ACTIVATE";
export { DELETE } from "./DELETE";
export { ESCAPE } from "./ESCAPE";
export { EXPAND } from "./EXPAND";
export { FOCUS } from "./FOCUS";
export { NAVIGATE } from "./NAVIGATE";
export { RECOVER } from "./RECOVER";
export { SELECT } from "./SELECT";
export { SELECT_ALL } from "./SELECT_ALL";
export { SYNC_FOCUS } from "./SYNC_FOCUS";
export { TAB } from "./TAB";
export { TOGGLE } from "./TOGGLE";
