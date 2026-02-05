/**
 * Selector Registry
 * 
 * Phase 3: RESOLVE (Strategy Registry)
 * Implements OCP by allowing registration of new selection strategies.
 */

import type { SelectConfig } from '../../../types';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface SelectResult {
    changed: boolean;
    selection: string[];
    anchor: string | null;
}

export type SelectStrategy = (
    targetId: string | undefined, // targetId might be undefined for 'none' or 'all'
    currentSelection: string[],
    currentAnchor: string | null,
    items: string[],
    config: SelectConfig
) => SelectResult;

// ═══════════════════════════════════════════════════════════════════
// Default Strategies
// ═══════════════════════════════════════════════════════════════════

export const resolveSingle: SelectStrategy = (targetId, currentSelection) => {
    if (!targetId) return { changed: false, selection: currentSelection, anchor: null };

    // If already selected and single, no change (unless toggle behavior is desired?)
    // Standard single select usually replaces.
    if (currentSelection.length === 1 && currentSelection[0] === targetId) {
        return { changed: false, selection: currentSelection, anchor: targetId };
    }

    return {
        changed: true,
        selection: [targetId],
        anchor: targetId
    };
};

export const resolveToggle: SelectStrategy = (targetId, currentSelection, currentAnchor) => {
    if (!targetId) return { changed: false, selection: currentSelection, anchor: currentAnchor };

    const isSelected = currentSelection.includes(targetId);
    let newSelection: string[];

    if (isSelected) {
        newSelection = currentSelection.filter(id => id !== targetId);
    } else {
        newSelection = [...currentSelection, targetId];
    }

    return {
        changed: true,
        selection: newSelection,
        anchor: targetId
    };
};

export const resolveRange: SelectStrategy = (targetId, currentSelection, currentAnchor, items) => {
    if (!targetId) return { changed: false, selection: currentSelection, anchor: currentAnchor };

    const anchor = currentAnchor || targetId;
    const anchorIndex = items.indexOf(anchor);
    const targetIndex = items.indexOf(targetId);

    if (anchorIndex === -1 || targetIndex === -1) {
        return { changed: false, selection: currentSelection, anchor: currentAnchor };
    }

    const start = Math.min(anchorIndex, targetIndex);
    const end = Math.max(anchorIndex, targetIndex);
    const range = items.slice(start, end + 1);

    // Range selection usually replaces current selection in simple implementation
    // Or it might add to it? Let's assume standard Shift+Click behavior (replace with range)

    return {
        changed: true,
        selection: range,
        anchor: anchor // Anchor stays at the start of the range press
    };
};

export const resolveAll: SelectStrategy = (_target, _curr, _anchor, items) => {
    return {
        changed: true,
        selection: [...items],
        anchor: _anchor
    };
};

export const resolveNone: SelectStrategy = (_target, currentSelection, currentAnchor) => {
    if (currentSelection.length === 0) return { changed: false, selection: [], anchor: currentAnchor };
    return {
        changed: true,
        selection: [],
        anchor: null
    };
};


// ═══════════════════════════════════════════════════════════════════
// Registry
// ═══════════════════════════════════════════════════════════════════

const strategies = new Map<string, SelectStrategy>();

export function registerSelectionStrategy(name: string, strategy: SelectStrategy): void {
    strategies.set(name, strategy);
}

// Register Defaults
registerSelectionStrategy('single', resolveSingle);
registerSelectionStrategy('toggle', resolveToggle);
registerSelectionStrategy('range', resolveRange);
registerSelectionStrategy('all', resolveAll);
registerSelectionStrategy('none', resolveNone);
registerSelectionStrategy('multiple', resolveSingle); // Fallback for multiple without modifiers

export function getSelectionStrategy(name: string): SelectStrategy | undefined {
    return strategies.get(name);
}

// ═══════════════════════════════════════════════════════════════════
// Facade
// ═══════════════════════════════════════════════════════════════════

export function resolveWithSelectionStrategy(
    mode: string,
    ...args: Parameters<SelectStrategy>
): SelectResult {
    const strategy = strategies.get(mode) || strategies.get('single');
    if (strategy) {
        return strategy(...args);
    }
    return { changed: false, selection: args[1], anchor: args[2] };
}
