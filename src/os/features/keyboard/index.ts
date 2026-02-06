/**
 * Keyboard Feature - Unified Input Pipeline
 * 
 * Handles all keyboard events, Field editing, and navigation.
 */

// Pipeline
export { KeyboardSensor } from './pipeline/1-sense/KeyboardSensor';
export { classifyKeyboard } from './pipeline/2-classify/classifyKeyboard';
export { routeKeyboard } from './pipeline/3-route/routeKeyboard';

// Intent Handler
export { KeyboardIntent } from './intent/KeyboardIntent';

// Registry
export { FieldRegistry } from './registry/FieldRegistry';

// Utilities
export { getCanonicalKey, normalizeKeyDefinition } from './lib/getCanonicalKey';

// Types
export * from './types';
