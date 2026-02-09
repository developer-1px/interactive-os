/**
 * FOCUS Command - Programmatic focus
 */

import type { OSCommand, OSContext, OSResult } from "../../schema/osTypes.ts";

// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

function buildFocusResult(
  ctx: OSContext,
  id: string,
  zoneId: string,
): OSResult {
  const result: OSResult = {
    state: { focusedItemId: id },
    activeZoneId: zoneId,
    domEffects: [{ type: "FOCUS", targetId: id }],
  };

  // Follow focus selection
  if (ctx.config.select.followFocus && ctx.config.select.mode !== "none") {
    result.state!.selection = [id];
    result.state!.selectionAnchor = id;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// FOCUS Command
// ═══════════════════════════════════════════════════════════════════

export const FOCUS: OSCommand<{ id: string; zoneId: string }> = {
  run: (ctx, payload) => buildFocusResult(ctx, payload.id, payload.zoneId),
};
