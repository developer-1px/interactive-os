/**
 * EXPAND Command - Expand/collapse tree items
 */

import {
  type ExpandAction,
  resolveExpansion,
} from "./resolveExpansion.ts";
import type { OSCommand } from "../../schema";

// ═══════════════════════════════════════════════════════════════════
// EXPAND Command
// ═══════════════════════════════════════════════════════════════════

export const EXPAND: OSCommand<{ itemId?: string; action?: ExpandAction }> = {
  run: (ctx, payload) => {
    const targetId = payload?.itemId ?? ctx.focusedItemId;
    if (!targetId) return null;

    const action = payload?.action ?? "toggle";

    const result = resolveExpansion(ctx.expandedItems, targetId, action);

    if (!result.changed) return null;

    return { state: { expandedItems: result.expandedItems } };
  },
};
