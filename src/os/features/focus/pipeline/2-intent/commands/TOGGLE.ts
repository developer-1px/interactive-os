/**
 * TOGGLE Command - Space key
 *
 * Smart toggle behavior:
 * 1. If Zone has toggleCommand → dispatch app command (checkbox etc.)
 * 2. Otherwise → toggle OS selection (multi-select)
 */

import type { OSCommand, OSResult } from "../../core/osCommand";

export const TOGGLE: OSCommand<{ targetId?: string }> = {
  run: (ctx, payload) => {
    const targetId = payload?.targetId ?? ctx.focusedItemId;
    if (!targetId) return null;

    // Priority 1: App-defined toggle command (checkbox, etc.)
    if (ctx.toggleCommand) {
      return { dispatch: ctx.toggleCommand };
    }

    // Priority 2: OS selection toggle (multi-select fallback)
    const isSelected = ctx.selection.includes(targetId);
    const newSelection = isSelected
      ? ctx.selection.filter((id) => id !== targetId)
      : [...ctx.selection, targetId];

    const result: OSResult = {
      state: {
        selection: newSelection,
        selectionAnchor: isSelected ? ctx.selectionAnchor : targetId,
      },
    };

    // Notify app of selection change if selectCommand exists
    if (ctx.selectCommand) {
      result.dispatch = ctx.selectCommand;
    }

    return result;
  },
};
