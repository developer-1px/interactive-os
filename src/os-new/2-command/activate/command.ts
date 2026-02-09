/**
 * ACTIVATE Command - Enter key activation
 */

import type { OSCommand } from "../../schema/types.ts";

// ═══════════════════════════════════════════════════════════════════
// ACTIVATE Command
// ═══════════════════════════════════════════════════════════════════

export const ACTIVATE: OSCommand<{ targetId?: string }> = {
  run: (ctx, payload) => {
    const targetId = payload?.targetId ?? ctx.focusedItemId;
    if (!targetId) return null;

    // W3C APG: Enter toggles expand/collapse for expandable items (treeitem, menuitem)
    const role = ctx.dom.queries.getItemRole(targetId);
    const isExpandable = role === "treeitem" || role === "menuitem";
    const isExpanded = ctx.expandedItems.includes(targetId);

    if (isExpandable) {
      return {
        state: {
          expandedItems: isExpanded
            ? ctx.expandedItems.filter((id) => id !== targetId)
            : [...ctx.expandedItems, targetId],
        },
        dispatch: ctx.activateCommand,
      };
    }

    // Synthesize click on the focused element (fires onClick handlers)
    return {
      domEffects: [{ type: "CLICK", targetId }],
      dispatch: ctx.activateCommand,
    };
  },
};
