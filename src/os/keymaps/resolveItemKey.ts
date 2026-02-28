/**
 * resolveItemKey — Item-layer key resolution
 *
 * Given a focused item's role, a canonical key, and item context,
 * returns the OS command that the item layer should execute,
 * or null if the item doesn't own this key.
 *
 * This is the Item tier of the ZIFT keyboard responder chain:
 *   Field → Item → Zone → OS Global
 *
 * Pure function. No DOM access.
 */

import type { BaseCommand } from "@kernel";
import { OS_ACTIVATE, OS_CHECK, OS_EXPAND, OS_SELECT } from "@os/3-commands";

// ═══════════════════════════════════════════════════════════════════
// Item Context
// ═══════════════════════════════════════════════════════════════════

export interface ItemKeyContext {
  itemId: string;
  expanded?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Item-layer keybindings per role
// ═══════════════════════════════════════════════════════════════════

type ItemKeyResolver = (key: string, ctx: ItemKeyContext) => BaseCommand | null;

/**
 * treeitem: ArrowRight/Left → expand/collapse (W3C APG Tree Pattern)
 *
 * - ArrowRight on collapsed → expand
 * - ArrowLeft on expanded → collapse
 * - ArrowRight on expanded → null (navigate to first child — Zone)
 * - ArrowLeft on collapsed → null (navigate to parent — Zone)
 */
const resolveTreeItem: ItemKeyResolver = (key, ctx) => {
  if (key === "ArrowRight" && ctx.expanded === false) {
    return OS_EXPAND({ action: "expand", itemId: ctx.itemId });
  }
  if (key === "ArrowLeft" && ctx.expanded === true) {
    return OS_EXPAND({ action: "collapse", itemId: ctx.itemId });
  }
  return null;
};

/**
 * checkbox / switch: Space → CHECK (W3C APG Checkbox Pattern)
 */
const resolveCheckable: ItemKeyResolver = (key, ctx) => {
  if (key === "Space") {
    return OS_CHECK({ targetId: ctx.itemId });
  }
  return null;
};

/**
 * radio / menuitemradio: Space → SELECT (W3C APG Radio Group Pattern)
 * Checks the focused radio. In radiogroup, selection = checked state.
 */
const resolveRadio: ItemKeyResolver = (key, ctx) => {
  if (key === "Space") {
    return OS_SELECT({ mode: "replace", targetId: ctx.itemId });
  }
  return null;
};

/**
 * button: Space → ACTIVATE (W3C APG Button Pattern)
 * Enter is already handled by the OS global keybinding.
 * Space must also activate — accordion headers, disclosure triggers, etc.
 */
const resolveButton: ItemKeyResolver = (key) => {
  if (key === "Space") {
    return OS_ACTIVATE();
  }
  return null;
};

const ITEM_RESOLVERS: Record<string, ItemKeyResolver> = {
  treeitem: resolveTreeItem,
  checkbox: resolveCheckable,
  switch: resolveCheckable,
  radio: resolveRadio,
  menuitemradio: resolveRadio,
  button: resolveButton,
};

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a key press to an Item-layer command.
 *
 * @param role - ARIA role of the focused item (e.g., "treeitem", "checkbox")
 * @param canonicalKey - Canonical key string
 * @param ctx - Item context (itemId, expanded state, etc.)
 * @returns BaseCommand if the item layer handles this key, null otherwise
 */
export function resolveItemKey(
  role: string | null,
  canonicalKey: string,
  ctx: ItemKeyContext,
): BaseCommand | null {
  if (!role) return null;

  const resolver = ITEM_RESOLVERS[role];
  if (!resolver) return null;

  return resolver(canonicalKey, ctx);
}
