/**
 * resolveKeyboard — Pure keyboard event resolution
 *
 * Translates sensed keyboard data into an action.
 * No DOM access. No side effects. Pure function.
 *
 * W3C UI Events Module: Keyboard Events (§3.5)
 */

import type { ZoneCursor } from "@os/2-contexts/zoneRegistry";
import { OS_CHECK } from "@os/3-commands";
import { Keybindings } from "@os/keymaps/keybindings";
import type { ResolveResult } from "../shared";

// ═══════════════════════════════════════════════════════════════════
// Input / Output Types
// ═══════════════════════════════════════════════════════════════════

export interface KeyboardInput {
  canonicalKey: string;
  key: string;
  isEditing: boolean;
  isFieldActive: boolean;
  isComposing: boolean;
  isDefaultPrevented: boolean;
  isInspector: boolean;
  isCombobox: boolean;

  /** Role of the closest [data-item-id] element, e.g. "checkbox", "switch" */
  focusedItemRole: string | null;
  focusedItemId: string | null;

  /** Whether the active zone has onCheck registered */
  activeZoneHasCheck: boolean;
  activeZoneFocusedItemId: string | null;

  /** For building input meta */
  elementId: string | undefined;

  /** For resolving ZoneCallbacks */
  cursor: ZoneCursor | null;
}

interface InputMeta {
  type: "KEYBOARD";
  key: string;
  code: string;
  elementId: string | undefined;
}

// ═══════════════════════════════════════════════════════════════════
// Pure Resolution
// ═══════════════════════════════════════════════════════════════════

export function resolveKeyboard(input: KeyboardInput): ResolveResult {
  // Guard: IME, defaultPrevented, inspector, combobox
  if (input.isDefaultPrevented || input.isComposing) {
    return { commands: [], meta: null, preventDefault: false, fallback: false };
  }
  if (input.isInspector || input.isCombobox) {
    return { commands: [], meta: null, preventDefault: false, fallback: false };
  }

  const meta: InputMeta = {
    type: "KEYBOARD",
    key: input.key,
    code: input.canonicalKey,
    elementId: input.elementId,
  };

  // Space on checkbox/switch → CHECK override (W3C APG)
  if (input.canonicalKey === "Space" && !input.isEditing) {
    const checkResult = resolveCheck(input, meta);
    if (checkResult) return checkResult;
  }

  // Resolve keybinding with dual context
  const binding = Keybindings.resolve(input.canonicalKey, {
    isEditing: input.isEditing,
    isFieldActive: input.isFieldActive,
  });

  if (!binding) {
    return { commands: [], meta: null, preventDefault: false, fallback: true };
  }

  if (typeof binding.command === "function") {
    if (!input.cursor) {
      return {
        commands: [],
        meta: null,
        preventDefault: false,
        fallback: false,
      };
    }
    const cmds = binding.command(input.cursor);
    return {
      commands: Array.isArray(cmds) ? cmds : [cmds],
      meta,
      preventDefault: true,
      fallback: false,
    };
  }

  return {
    commands: [binding.command],
    meta,
    preventDefault: true,
    fallback: false,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CHECK Resolution (Space on checkbox/switch)
// ═══════════════════════════════════════════════════════════════════

function resolveCheck(
  input: KeyboardInput,
  meta: InputMeta,
): ResolveResult | null {
  // Case 1: Explicit checkbox/switch role → always CHECK
  if (
    (input.focusedItemRole === "checkbox" ||
      input.focusedItemRole === "switch") &&
    input.focusedItemId
  ) {
    return {
      commands: [OS_CHECK({ targetId: input.focusedItemId })],
      meta: { ...meta, elementId: input.focusedItemId },
      preventDefault: true,
      fallback: false,
    };
  }

  // Case 2: Active zone has onCheck registered → CHECK (app semantics)
  if (input.activeZoneHasCheck && input.activeZoneFocusedItemId) {
    return {
      commands: [OS_CHECK({ targetId: input.activeZoneFocusedItemId })],
      meta: { ...meta, elementId: input.activeZoneFocusedItemId },
      preventDefault: true,
      fallback: false,
    };
  }

  return null;
}
