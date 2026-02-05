/**
 * Pipeline - Intercept Phase
 * 
 * OS-level event capture before browser default handling
 * First phase of the 5-phase pipeline
 */

import type { KeyboardEvent } from "react";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface InterceptedEvent {
    type: 'keyboard' | 'pointer' | 'focus';
    originalEvent: Event;
    key?: string;
    modifiers: {
        shift: boolean;
        ctrl: boolean;
        alt: boolean;
        meta: boolean;
    };
    target: HTMLElement | null;
    timestamp: number;
    /** Whether the event should be passed to the next phase */
    shouldContinue: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Intercept Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Intercept keyboard event and normalize
 */
export function interceptKeyboard(event: KeyboardEvent): InterceptedEvent {
    return {
        type: 'keyboard',
        originalEvent: event.nativeEvent,
        key: event.key,
        modifiers: {
            shift: event.shiftKey,
            ctrl: event.ctrlKey,
            alt: event.altKey,
            meta: event.metaKey,
        },
        target: event.target as HTMLElement,
        timestamp: Date.now(),
        shouldContinue: true,
    };
}

/**
 * Intercept pointer event and normalize
 */
export function interceptPointer(event: React.PointerEvent): InterceptedEvent {
    return {
        type: 'pointer',
        originalEvent: event.nativeEvent,
        modifiers: {
            shift: event.shiftKey,
            ctrl: event.ctrlKey,
            alt: event.altKey,
            meta: event.metaKey,
        },
        target: event.target as HTMLElement,
        timestamp: Date.now(),
        shouldContinue: true,
    };
}

/**
 * Check if event should be handled by OS
 */
export function shouldIntercept(event: InterceptedEvent): boolean {
    // Navigation keys
    const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'];
    // Action keys
    const actionKeys = ['Enter', ' ', 'Escape'];

    if (event.type === 'keyboard' && event.key) {
        return navKeys.includes(event.key) || actionKeys.includes(event.key);
    }

    return true;
}
