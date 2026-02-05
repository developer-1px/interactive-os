/**
 * updateSelect - Selection Logic
 * 
 * Phase 3: RESOLVE (Select)
 * Pure function delegating to registered selection strategies.
 */

import type { SelectConfig } from '../../types';
import { resolveWithSelectionStrategy, type SelectResult } from './strategies/selectorRegistry';

export function updateSelect(
    targetId: string | undefined, // undefined for 'none' or 'all' if not checking items
    currentSelection: string[],
    currentAnchor: string | null,
    items: string[],
    config: SelectConfig,
    overrideMode?: 'single' | 'toggle' | 'range' | 'all' | 'none'
): SelectResult {
    // Determine mode: override > config.mode
    const mode = overrideMode || config.mode;

    return resolveWithSelectionStrategy(
        mode,
        targetId,
        currentSelection,
        currentAnchor,
        items,
        config
    );
}
