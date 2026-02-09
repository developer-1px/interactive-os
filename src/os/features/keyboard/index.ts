/**
 * Keyboard Feature - Unified Input Pipeline
 *
 * Handles all keyboard events, Field editing, and navigation.
 */

// Intent Handler
export { KeyboardIntent } from "../../new/1-sensor/keyboard/KeyboardIntent.tsx";
// Utilities
export { getCanonicalKey, normalizeKeyDefinition } from "../../new/1-sensor/keyboard/getCanonicalKey.ts";
// Pipeline
export { KeyboardSensor } from "../../new/1-sensor/keyboard/KeyboardSensor.tsx";
export { classifyKeyboard } from "../../new/1-sensor/keyboard/classifyKeyboard.ts";
export { routeKeyboard } from "./pipeline/3-route/routeKeyboard";
// Registry
export { FieldRegistry } from "./registry/FieldRegistry";

// Types
export * from "./types";
