/**
 * DISMISS Command - Escape key dismiss
 */

import type { OSCommand, OSContext, OSResult } from "../../core/osCommand";

// ═══════════════════════════════════════════════════════════════════
// Dismiss Action Handlers
// ═══════════════════════════════════════════════════════════════════

function handleDeselect(ctx: OSContext): OSResult | null {
  if (ctx.selection.length === 0) return null;

  return {
    state: {
      selection: [],
      selectionAnchor: null,
    },
  };
}

function handleClose(): OSResult {
  return {
    state: { focusedItemId: null },
    domEffects: [{ type: "BLUR" }],
  };
}

// ═══════════════════════════════════════════════════════════════════
// DISMISS Command
// ═══════════════════════════════════════════════════════════════════

export const DISMISS: OSCommand<{}> = {
  run: (ctx, _payload) => {
    switch (ctx.config.dismiss.escape) {
      case "deselect":
        return handleDeselect(ctx);
      case "close":
        return handleClose();
      default:
        return null;
    }
  },
};
