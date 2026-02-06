/**
 * OS Commands - Pure functions for focus management
 * 
 * Each command:
 * - Takes OSContext (read snapshot)
 * - Returns OSResult (state + effects)
 * - No side effects
 */

export { NAVIGATE } from './NAVIGATE';
export { TAB } from './TAB';
export { SELECT } from './SELECT';
export { ACTIVATE } from './ACTIVATE';
export { FOCUS } from './FOCUS';
export { DISMISS } from './DISMISS';
export { EXPAND } from './EXPAND';

// Clipboard Commands
export { COPY } from './COPY';
export { CUT } from './CUT';
export { PASTE } from './PASTE';

// Editing Commands
export { TOGGLE } from './TOGGLE';
export { DELETE } from './DELETE';
export { UNDO } from './UNDO';
export { REDO } from './REDO';

