/**
 * Pipeline - Parse Phase
 * 
 * Key → Intent mapping
 * Translates raw events into semantic intents
 */

import type { InterceptedEvent } from '../1-intercept';

// ═══════════════════════════════════════════════════════════════════
// Intent Types
// ═══════════════════════════════════════════════════════════════════

export type IntentType =
    | 'NAVIGATE'
    | 'TAB'
    | 'SELECT'
    | 'ACTIVATE'
    | 'DISMISS'
    | 'TYPEAHEAD'
    | 'UNKNOWN';

export type NavigateDirection = 'up' | 'down' | 'left' | 'right' | 'first' | 'last' | 'next' | 'prev';

export interface ParsedIntent {
    type: IntentType;
    direction?: NavigateDirection;
    modifier?: 'shift' | 'ctrl' | 'range';
    sourceEvent: InterceptedEvent;
}

// ═══════════════════════════════════════════════════════════════════
// Parse Functions
// ═══════════════════════════════════════════════════════════════════

const KEY_TO_DIRECTION: Record<string, NavigateDirection> = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'Home': 'first',
    'End': 'last',
};

/**
 * Parse intercepted event into semantic intent
 */
export function parseIntent(event: InterceptedEvent): ParsedIntent {
    if (event.type !== 'keyboard' || !event.key) {
        return { type: 'UNKNOWN', sourceEvent: event };
    }

    const { key, modifiers } = event;

    // --- Navigation ---
    if (KEY_TO_DIRECTION[key]) {
        return {
            type: 'NAVIGATE',
            direction: KEY_TO_DIRECTION[key],
            modifier: modifiers.shift ? 'shift' : modifiers.ctrl ? 'ctrl' : undefined,
            sourceEvent: event,
        };
    }

    // --- Tab ---
    if (key === 'Tab') {
        return {
            type: 'TAB',
            direction: modifiers.shift ? 'prev' : 'next',
            sourceEvent: event,
        };
    }

    // --- Activate ---
    if (key === 'Enter' || key === ' ') {
        return {
            type: modifiers.ctrl ? 'SELECT' : 'ACTIVATE',
            modifier: modifiers.ctrl ? 'ctrl' : modifiers.shift ? 'range' : undefined,
            sourceEvent: event,
        };
    }

    // --- Dismiss ---
    if (key === 'Escape') {
        return {
            type: 'DISMISS',
            sourceEvent: event,
        };
    }

    // --- Typeahead ---
    if (key.length === 1 && !modifiers.ctrl && !modifiers.alt && !modifiers.meta) {
        return {
            type: 'TYPEAHEAD',
            sourceEvent: event,
        };
    }

    return { type: 'UNKNOWN', sourceEvent: event };
}
