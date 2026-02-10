/**
 * Keyboard Feature - Unified Input Pipeline
 *
 * Handles all keyboard events, Field editing, and navigation.
 */

// Intent Handler
// Utilities
export { getCanonicalKey, normalizeKeyDefinition } from "@/os-new/1-sensor/keyboard/getCanonicalKey.ts";
// Pipeline
export { classifyKeyboard } from "@/os-new/1-sensor/keyboard/classifyKeyboard.ts";
export { routeKeyboard } from "./pipeline/3-route/routeKeyboard";
// Registry
export { FieldRegistry } from "./registry/FieldRegistry";

// Types
export * from "./types";
