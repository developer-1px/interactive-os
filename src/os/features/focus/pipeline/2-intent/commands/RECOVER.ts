/**
 * RECOVER Command - Focus Recovery
 *
 * Executed when focus is lost (document.body).
 * Uses pre-computed recoveryTargetId from store.
 */

import type { OSCommand } from "../../core/osCommand";

export const RECOVER: OSCommand = {
  run: (ctx) => {
    // 1. If focused item still exists in DOM, just re-focus it
    // (This handles cases where focus was lost due to blur but item remains)
    if (ctx.focusedItemId && ctx.dom.items.includes(ctx.focusedItemId)) {
      return { domEffects: [{ type: "FOCUS", targetId: ctx.focusedItemId }] };
    }

    // 2. Use Pre-computed recovery target
    // (Computed automatically by runOS when focus was set)
    const recoveryId = ctx.store.getState().recoveryTargetId;

    // 2a. Verify if recovery target exists in current DOM
    // If not, fallback to first available item
    const targetId =
      recoveryId && ctx.dom.items.includes(recoveryId)
        ? recoveryId
        : (ctx.dom.items[0] ?? null);

    if (!targetId) return null;

    return {
      state: { focusedItemId: targetId },
      domEffects: [{ type: "FOCUS", targetId }],
    };
  },
};
