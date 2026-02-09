/**
 * resolveKeybinding - Command Pipeline Phase 2: RESOLVE
 *
 * Responsibility: Match KeyboardIntent to a single Keybinding.
 *
 * Input:  KeyboardIntent + keybindings + focusPath
 * Output: ResolvedBinding | null
 *
 * This is a PURE function - no side effects, no state mutations.
 * It performs hierarchical lookup and 'when' clause evaluation.
 */

import { evalContext } from "@os/features/AntigravityOS";
import { OS_COMMANDS } from "@os/features/command/definitions/commandsShell";
import { FocusData } from "@os/features/focus/lib/focusData";
import { normalizeKeyDefinition } from "@/os-new/1-sensor/keyboard/getCanonicalKey.ts";
import type { KeyboardIntent } from "@/os-new/1-sensor/keyboard/interceptKeyboard.ts";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface KeybindingEntry {
  key: string;
  command: string;
  args?: Record<string, unknown>;
  when?: string;
  groupId?: string;
  allowInInput?: boolean;
}

export interface ResolveContext {
  activeGroup?: string;
  focusPath: string[];
  focusedItemId: string | null;
  [key: string]: unknown;
}

export interface ResolvedBinding {
  /** The matched keybinding entry */
  binding: KeybindingEntry;

  /** Resolved arguments (OS.FOCUS expanded) */
  resolvedArgs: Record<string, unknown> | undefined;
}

// ═══════════════════════════════════════════════════════════════════
// Main Function
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a KeyboardIntent to a single keybinding using hierarchical lookup.
 *
 * Resolution order:
 * 1. Match keybindings by canonicalKey
 * 2. Bubble through focusPath (deepest → root → global)
 * 3. Evaluate 'when' clauses
 * 4. Return first match or null
 *
 * @param intent - The keyboard intent from Phase 1
 * @param bindings - All available keybindings (app + OS merged)
 * @param context - Evaluation context for 'when' clauses
 * @param bubblePath - Focus path to bubble through (reversed focusPath + "global")
 */
export function resolveKeybinding(
  intent: KeyboardIntent,
  bindings: KeybindingEntry[],
  context: ResolveContext,
  bubblePath: string[],
): ResolvedBinding | null {
  const { canonicalKey, isFromInput } = intent;

  // Step 1: Filter bindings by key
  const keyMatches = bindings.filter(
    (b) => normalizeKeyDefinition(b.key) === canonicalKey,
  );

  if (keyMatches.length === 0) return null;

  // Step 2: Bubble through focus path
  for (const layerId of bubblePath) {
    const isGlobal = layerId === "global";

    // Filter bindings for this layer
    const layerBindings = keyMatches.filter((b) => {
      if (isGlobal) return !b.groupId;
      return b.groupId === layerId;
    });

    // Step 3: Evaluate each binding
    for (const binding of layerBindings) {
      const evaluationCtx = { ...context, isInput: isFromInput };

      // Note: allowInInput check removed - classifyKeyboard already determines
      // if a key from Field context should route to COMMAND vs FIELD.

      // Evaluate 'when' clause
      if (binding.when && !evalContext(binding.when, evaluationCtx)) continue;

      // Step 4: Check Zone binding for passthrough commands
      if (!hasZoneBinding(binding.command)) continue;

      // Step 5: Resolve special args (OS.FOCUS etc.)
      const resolvedArgs = resolveArgs(binding.args, evaluationCtx);

      return {
        binding,
        resolvedArgs,
      };
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve special argument placeholders.
 * Currently supports: OS.FOCUS → focusedItemId
 */
function resolveArgs(
  args: Record<string, unknown> | undefined,
  context: ResolveContext,
): Record<string, unknown> | undefined {
  if (!args || typeof args !== "object") return args;

  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args)) {
    if (value === "OS.FOCUS") {
      resolved[key] = context.focusedItemId;
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * Check if Zone has a binding for passthrough commands.
 * For clipboard/editing commands, we check if the active Zone has the corresponding prop.
 * If not, the keybinding should not match so browser default can take over.
 *
 * Returns true for non-passthrough commands (always match).
 */
function hasZoneBinding(commandId: string): boolean {
  // Only check passthrough commands
  // Note: TOGGLE is NOT here because Space's browser default is scroll, not a useful action
  const PASSTHROUGH_COMMANDS: Record<string, string> = {
    [OS_COMMANDS.COPY]: "copyCommand",
    [OS_COMMANDS.CUT]: "cutCommand",
    [OS_COMMANDS.PASTE]: "pasteCommand",
    [OS_COMMANDS.DELETE]: "deleteCommand",
    [OS_COMMANDS.UNDO]: "undoCommand",
    [OS_COMMANDS.REDO]: "redoCommand",
  };

  const bindingKey = PASSTHROUGH_COMMANDS[commandId];
  if (!bindingKey) return true; // Not a passthrough command, always match

  const zone = FocusData.getActiveZone();
  if (!zone) return false; // No active zone, don't match

  return !!(zone as any)[bindingKey];
}

// ═══════════════════════════════════════════════════════════════════
// Utility: Build Bubble Path (re-exported from canonical location)
// ═══════════════════════════════════════════════════════════════════

export { buildBubblePath } from "@/os-new/4-effect/buildBubblePath";
