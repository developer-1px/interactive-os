/**
 * interceptKeyboard - Command Pipeline Phase 1: INTERCEPT
 *
 * Responsibility: Transform raw keyboard events into CommandIntent.
 *
 * Input:  KeyboardEvent
 * Output: KeyboardIntent | null
 *
 * This is a PURE function - no side effects, no state mutations.
 * It only interprets the raw event and extracts relevant metadata.
 */

import { getCanonicalKey } from '@os/features/keyboard/lib/getCanonicalKey';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface KeyboardIntent {
    /** Normalized key string (e.g., "cmd+k", "ctrl+enter") */
    canonicalKey: string;

    /** Whether the event originated from an input field */
    isFromInput: boolean;

    /** The target element that received the event */
    target: HTMLElement;

    /** Raw event for edge cases */
    originalEvent: KeyboardEvent;
}

// ═══════════════════════════════════════════════════════════════════
// Main Function
// ═══════════════════════════════════════════════════════════════════

/**
 * Transform a raw KeyboardEvent into a structured KeyboardIntent.
 *
 * Returns null if the event should be ignored (e.g., during IME composition).
 *
 * @param event - The raw keyboard event from the DOM
 * @returns KeyboardIntent or null if event should be skipped
 */
export function interceptKeyboard(event: KeyboardEvent): KeyboardIntent | null {
    // Skip already-handled events
    if (event.defaultPrevented) return null;

    // Skip IME composition (e.g., Korean, Japanese input)
    if (event.isComposing) return null;

    // Extract target element
    const target = event.target as HTMLElement;
    if (!target) return null;

    // Detect input field context
    const isFromInput = isInputElement(target);

    // Normalize key to canonical form
    const canonicalKey = getCanonicalKey(event);

    return {
        canonicalKey,
        isFromInput,
        target,
        originalEvent: event,
    };
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if the target element is an input-like element.
 */
function isInputElement(target: HTMLElement): boolean {
    return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
    );
}
