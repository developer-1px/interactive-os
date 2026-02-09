/**
 * OS Commands — barrel export
 *
 * Re-exports all pure commands from their respective folders.
 * Used by FocusIntent.tsx as a single import point.
 */

// Focus management
export { FOCUS } from "./command";
export { SYNC_FOCUS } from "./sync";
export { RECOVER } from "./recover";

// Navigation
export { NAVIGATE } from "../navigate/command";
export { TAB } from "../tab/command";

// Selection
export { SELECT } from "../select/command";
export { SELECT_ALL } from "../select/all";

// Actions
export { ACTIVATE } from "../activate/command";
export { DELETE } from "../delete/command";
export { ESCAPE } from "../escape/command";
export { TOGGLE } from "../toggle/command";
