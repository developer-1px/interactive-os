/**
 * ACTIVATE Command - Enter key activation
 */

import type { OSCommand } from "../../core/osCommand";

// ═══════════════════════════════════════════════════════════════════
// ACTIVATE Command
// ═══════════════════════════════════════════════════════════════════

export const ACTIVATE: OSCommand<{ targetId?: string }> = {
  run: (ctx, payload) => {
    const targetId = payload?.targetId ?? ctx.focusedItemId;
    if (!targetId) return null;

    if (!ctx.activateCommand) return null;

    return { dispatch: ctx.activateCommand };
  },
};
