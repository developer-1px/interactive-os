/**
 * RECOVER Command - Focus Recovery
 *
 * Executed when focus is lost (document.body).
 * Uses pre-computed recoveryTargetId from context.
 *
 * Pure function — reads only from ctx, no store access.
 */

import type { OSCommand } from "@os/features/focus/pipeline/core/osCommand.ts";

export const RECOVER: OSCommand = {
  run: (ctx) => {
    // 1. If focused item still exists in DOM, just re-focus it
    if (ctx.focusedItemId && ctx.dom.items.includes(ctx.focusedItemId)) {
      return { domEffects: [{ type: "FOCUS", targetId: ctx.focusedItemId }] };
    }

    // 2. Use pre-computed recovery target from context
    const recoveryId = ctx.recoveryTargetId;

    // 3. Verify recovery target exists in current DOM, fallback to first item
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

