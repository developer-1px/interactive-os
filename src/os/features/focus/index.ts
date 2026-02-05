/**
 * Focus Feature - Public API
 * 
 * Pipeline-centric architecture
 */

// --- Pipeline ---
export * from './pipeline';

// --- Store ---
export { useFocusStore } from './store';

// --- Registry ---
export { DOMInterface, resolveRole, roleRegistry, registerRole } from './registry';

// --- Primitives ---
export { Focusable, FocusGroup, FocusScope } from './primitives';
