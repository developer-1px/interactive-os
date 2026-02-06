/**
 * KeyboardSensor - Global Input Event Interceptor
 * Pipeline Phase 1: SENSE
 *
 * Responsibility: Capture all input events (keyboard, input, blur) and route through pipeline.
 * Single entry point for all input into the OS.
 */

import { useKeyboardEvents } from './useKeyboardEvents';
import { useInputEvents } from './useInputEvents';

// Re-export for backward compatibility
export { isComposing } from './useKeyboardEvents';

export function KeyboardSensor() {
    useKeyboardEvents();
    useInputEvents();
    return null;
}
