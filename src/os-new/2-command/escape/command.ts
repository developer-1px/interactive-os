/**
 * ESCAPE Command - Handles Escape key press
 *
 * Behavior determined by Zone's dismiss config:
 * - "deselect": Clear current selection
 * - "close": Blur/close the zone
 * - "none": No action
 */

import type { OSCommand, OSContext, OSResult } from "../../schema/types.ts";

// ═══════════════════════════════════════════════════════════════════
// Escape Action Handlers
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
// ESCAPE Command
// ═══════════════════════════════════════════════════════════════════

export const ESCAPE: OSCommand<{}> = {
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
