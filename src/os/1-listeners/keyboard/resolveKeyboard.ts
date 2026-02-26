/**
 * resolveKeyboard — Pure keyboard event resolution
 *
 * ZIFT Responder Chain: Field → Item → Zone → OS Global
 *
 * Each layer gets a chance to handle the key in priority order.
 * The first layer that returns a command wins.
 *
 * No DOM access. No side effects. Pure function.
 */

import type { ZoneCursor } from "@os/2-contexts/zoneRegistry";
import { OS_CHECK } from "@os/3-commands";
import { Keybindings } from "@os/keymaps/keybindings";
import { resolveFieldKey } from "@os/keymaps/resolveFieldKey";
import { resolveItemKey } from "@os/keymaps/resolveItemKey";
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

  // ─── Field layer ───
  /** FieldRegistry id of the currently editing field, or null */
  editingFieldId: string | null;

  // ─── Item layer ───
  /** Role of the closest [data-item-id] element, e.g. "checkbox", "switch" */
  focusedItemRole: string | null;
  focusedItemId: string | null;
  /** Whether the focused item is expanded (for treeitem) */
  focusedItemExpanded: boolean | null;

  /** Whether the active zone has onCheck registered */
  activeZoneHasCheck: boolean;
  activeZoneFocusedItemId: string | null;

  /** For building input meta */
  elementId: string | undefined;

  /** For resolving ZoneCallbacks */
  cursor: ZoneCursor | null;
}

interface InputMeta extends Record<string, unknown> {
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

  // ═══════════════════════════════════════════════════════════════
  // ZIFT Responder Chain: Field → Item → Zone → Global
  // ═══════════════════════════════════════════════════════════════

  // Layer 1: Field — editing field owns Enter/Escape per fieldType
  if (input.editingFieldId) {
    const fieldCmd = resolveFieldKey(input.editingFieldId, input.canonicalKey);
    if (fieldCmd) {
      return {
        commands: [fieldCmd],
        meta,
        preventDefault: true,
        fallback: false,
      };
    }
    // Field is editing but didn't claim this key.
    // If the field is active (owns this key for text editing), stop here.
    if (input.isFieldActive) {
      return {
        commands: [],
        meta: null,
        preventDefault: false,
        fallback: false,
      };
    }
  }

  // Layer 2: Item — role-specific keys (treeitem expand, checkbox check)
  if (!input.isEditing && input.focusedItemId) {
    const itemCmd = resolveItemKey(input.focusedItemRole, input.canonicalKey, {
      itemId: input.focusedItemId,
      ...(input.focusedItemExpanded != null
        ? { expanded: input.focusedItemExpanded }
        : {}),
    });
    if (itemCmd) {
      return {
        commands: [itemCmd],
        meta: { ...meta, elementId: input.focusedItemId },
        preventDefault: true,
        fallback: false,
      };
    }
  }

  // Item fallback: Zone has onCheck registered → Space = CHECK (app semantics)
  // This works with activeZoneFocusedItemId even when DOM focusedItemId is null
  if (
    !input.isEditing &&
    input.canonicalKey === "Space" &&
    input.activeZoneHasCheck &&
    input.activeZoneFocusedItemId
  ) {
    return {
      commands: [OS_CHECK({ targetId: input.activeZoneFocusedItemId })],
      meta: { ...meta, elementId: input.activeZoneFocusedItemId },
      preventDefault: true,
      fallback: false,
    };
  }

  // Layer 3+4: Zone + Global — Keybindings registry
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
