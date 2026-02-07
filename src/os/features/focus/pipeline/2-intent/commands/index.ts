/**
 * OS Commands - Pure functions for focus management
 *
 * Each command:
 * - Takes OSContext (read snapshot)
 * - Returns OSResult (state + effects)
 * - No side effects
 */

export { ACTIVATE } from "./ACTIVATE";
// Clipboard Commands
export { COPY } from "./COPY";
export { CUT } from "./CUT";
export { DELETE } from "./DELETE";
export { DISMISS } from "./DISMISS";
export { EXPAND } from "./EXPAND";
export { FOCUS } from "./FOCUS";
export { NAVIGATE } from "./NAVIGATE";
export { PASTE } from "./PASTE";
export { RECOVER } from "./RECOVER";
export { REDO } from "./REDO";
export { SELECT } from "./SELECT";
export { TAB } from "./TAB";
// Editing Commands
export { TOGGLE } from "./TOGGLE";
export { UNDO } from "./UNDO";
