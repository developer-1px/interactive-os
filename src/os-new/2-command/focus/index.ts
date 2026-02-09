/**
 * OS Commands — barrel export
 *
 * Re-exports all pure commands from their respective folders.
 * Used by FocusIntent.tsx as a single import point.
 */

// Focus management
export { FOCUS } from "./command.ts";
export { SYNC_FOCUS } from "./sync.ts";
export { RECOVER } from "./RECOVER.ts";

// Navigation
export { NAVIGATE } from "../navigate/command.ts";
export { TAB } from "../tab/command.ts";

// Selection
export { SELECT } from "../select/command.ts";
export { SELECT_ALL } from "../select/all.ts";

// Actions
export { ACTIVATE } from "../activate/command.ts";
export { DELETE } from "../delete/command.ts";
export { ESCAPE } from "../escape/command.ts";
export { TOGGLE } from "../toggle/command.ts";
