/**
 * chainResolver — Generic ZIFT Chain Executor
 *
 * Resolves an input (key or event name) through an ordered list of keymaps.
 * First keymap to claim the input wins. Binary return:
 *   - Command (including NOOP) → stop chain
 *   - null / undefined → pass to next layer
 *
 * Keymap values can be:
 *   - BaseCommand → return immediately (claim)
 *   - NOOP → stop chain, no action (absorb)
 *   - (Command | null)[] → try each in order, first non-null wins (toggle pattern)
 *   - null → explicit pass (used in command chains)
 *
 * ZIFT Responder Chain: Field → Trigger → Item → Zone
 * Each layer is a Keymap. Priority = array order.
 *
 * Pure function. No DOM access. No side effects.
 *
 * @see design-principles.md #23, #24, #25
 */

import type { BaseCommand } from "@kernel/core/tokens";

// ═══════════════════════════════════════════════════════════════════
// NOOP — chain stopper with no action
// ═══════════════════════════════════════════════════════════════════

/**
 * NOOP sentinel: "I own this key, but no OS command needed."
 * Used by Field layer to absorb keys (e.g., Enter in block field = newline).
 */
export const NOOP: BaseCommand = {
  type: "NOOP",
  payload: {},
};

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

/**
 * Keymap: input string → command resolution.
 *
 * Values:
 *   BaseCommand     → claim this input
 *   NOOP            → absorb this input (stop chain, no action)
 *   (Cmd | null)[]  → command chain (try in order, first non-null wins)
 */
export type KeymapValue = BaseCommand | (BaseCommand | null)[];
export type Keymap = Record<string, KeymapValue>;

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve an input through an ordered list of keymaps.
 *
 * @param input - Canonical key string or event name (e.g., "Enter", "Click")
 * @param layers - Ordered keymaps. First match wins.
 * @returns BaseCommand if claimed (including NOOP), null if no layer claimed
 */
export function resolveChain(
  input: string,
  layers: Keymap[],
): BaseCommand | null {
  for (const layer of layers) {
    const value = layer[input];
    if (value === undefined) continue;

    // ── Single command (including NOOP) → claim ──
    if (!Array.isArray(value)) {
      return value;
    }

    // ── Command chain → first non-null wins ──
    for (const cmd of value) {
      if (cmd !== null) return cmd;
    }

    // All entries in chain were null → this layer didn't claim
    // Fall through to next layer
  }

  return null;
}
