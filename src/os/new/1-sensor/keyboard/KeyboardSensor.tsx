/**
 * KeyboardSensor - Global Input Event Interceptor
 * Pipeline Phase 1: SENSE
 *
 * Responsibility: Capture all input events (keyboard, input, blur) and route through pipeline.
 * Single entry point for all input into the OS.
 */

import { useInputEvents } from "./useInputEvents.ts";
import { useKeyboardEvents } from "./useKeyboardEvents.ts";

// Re-export for backward compatibility
export { isComposing } from "./useKeyboardEvents.ts";

export function KeyboardSensor() {
  useKeyboardEvents();
  useInputEvents();
  return null;
}
