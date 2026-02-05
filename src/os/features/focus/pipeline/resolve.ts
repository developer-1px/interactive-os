/**
 * Pipeline - Resolve Phase
 * 
 * State calculation based on intent and current state
 * Pure function: (state, intent) → targetState
 */

import type { ParsedIntent, NavigateDirection } from './parse';

// ═══════════════════════════════════════════════════════════════════
// State Types
// ═══════════════════════════════════════════════════════════════════

export interface FocusState {
    focusedItemId: string | null;
    activeZoneId: string | null;
    selection: string[];
    selectionAnchor: string | null;
}

export interface ResolvedTarget {
    targetItemId: string | null;
    targetZoneId: string | null;
    newSelection?: string[];
    shouldFocus: boolean;
    shouldScroll: boolean;
    shouldPreventDefault: boolean;
}

export interface ZoneConfig {
    items: string[];
    orientation: 'horizontal' | 'vertical' | 'both';
    loop: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Resolve Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve next item based on direction
 */
function resolveNavigateTarget(
    currentIndex: number,
    direction: NavigateDirection,
    items: string[],
    loop: boolean
): string | null {
    if (items.length === 0) return null;

    let nextIndex: number;

    switch (direction) {
        case 'first':
            nextIndex = 0;
            break;
        case 'last':
            nextIndex = items.length - 1;
            break;
        case 'next':
        case 'down':
        case 'right':
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length) {
                nextIndex = loop ? 0 : items.length - 1;
            }
            break;
        case 'prev':
        case 'up':
        case 'left':
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
                nextIndex = loop ? items.length - 1 : 0;
            }
            break;
        default:
            return null;
    }

    return items[nextIndex] || null;
}

/**
 * Main resolve function
 */
export function resolveTarget(
    state: FocusState,
    intent: ParsedIntent,
    zoneConfig: ZoneConfig
): ResolvedTarget {
    const { items, loop } = zoneConfig;
    const currentIndex = state.focusedItemId
        ? items.indexOf(state.focusedItemId)
        : -1;

    // Default result
    const result: ResolvedTarget = {
        targetItemId: state.focusedItemId,
        targetZoneId: state.activeZoneId,
        shouldFocus: true,
        shouldScroll: true,
        shouldPreventDefault: true,
    };

    switch (intent.type) {
        case 'NAVIGATE':
            if (intent.direction) {
                result.targetItemId = resolveNavigateTarget(
                    currentIndex,
                    intent.direction,
                    items,
                    loop
                );
            }
            break;

        case 'SELECT':
            // Range selection with anchor
            if (intent.modifier === 'range' && state.selectionAnchor) {
                const anchorIndex = items.indexOf(state.selectionAnchor);
                const targetIndex = currentIndex;
                const start = Math.min(anchorIndex, targetIndex);
                const end = Math.max(anchorIndex, targetIndex);
                result.newSelection = items.slice(start, end + 1);
            } else {
                // Toggle selection
                result.newSelection = state.selection.includes(state.focusedItemId || '')
                    ? state.selection.filter(id => id !== state.focusedItemId)
                    : [...state.selection, state.focusedItemId || ''].filter(Boolean);
            }
            break;

        case 'TAB':
            // Tab를 통한 zone 이탈 - shouldPreventDefault를 false로
            result.shouldPreventDefault = false;
            result.shouldFocus = false;
            break;

        case 'DISMISS':
            // Escape 처리
            result.shouldPreventDefault = true;
            break;

        default:
            break;
    }

    return result;
}
