/**
 * resolveKeyboard — Pure keyboard event resolution
 *
 * ZIFT Responder Chain: Field → Trigger → Item → Zone
 * Each layer is a function. First claim wins.
 *
 * @see design-principles.md #23 (ordered keymap chain)
 * @see design-principles.md #24 (binary return: Command/NOOP = stop, null = pass)
 */

import type { BaseCommand } from "@kernel/core/tokens";
import {
  type Keymap,
  NOOP,
  resolveChain,
} from "@os-core/2-resolve/chainResolver";
import { Keybindings } from "@os-core/2-resolve/keybindings";
import {
  resolveFieldKey,
  resolveFieldKeyByType,
} from "@os-core/2-resolve/resolveFieldKey";
import type { FieldType } from "@os-core/engine/registries/fieldRegistry";
import {
  buildTriggerKeymap,
  resolveTriggerRole,
} from "@os-core/engine/registries/triggerRegistry";
import type { ZoneCursor } from "@os-core/engine/registries/zoneRegistry";
import type { InputMap } from "@os-core/schema/types/focus/config/FocusGroupConfig";
import type { ResolveResult } from "../_shared/domQuery";

// ═══════════════════════════════════════════════════════════════════
// Types
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
  editingFieldId: string | null;
  activeFieldType: FieldType | null;

  // ─── Item layer ───
  focusedItemRole: string | null;
  focusedItemId: string | null;
  focusedItemExpanded: boolean | null;

  activeZoneFocusedItemId: string | null;
  /** inputmap — APG keyboard interaction table: input → command[] */
  activeZoneInputmap: InputMap | null;

  elementId: string | undefined;

  // ─── Trigger layer ───
  focusedTriggerId: string | null;
  focusedTriggerRole: string | null;
  focusedTriggerOverlayId: string | null;
  isTriggerOverlayOpen: boolean;

  cursor: ZoneCursor | null;
}

interface InputMeta extends Record<string, unknown> {
  type: "KEYBOARD";
  key: string;
  code: string;
  elementId: string | undefined;
}

/** Layer return: command(s) + which element claimed it */
interface LayerResult {
  commands: BaseCommand[];
  elementId?: string;
}

/** Layer: (key) → result or null (pass) */
type Layer = (key: string) => LayerResult | null;

// ═══════════════════════════════════════════════════════════════════
// Pure Resolution — Layer[] first-wins loop
// ═══════════════════════════════════════════════════════════════════

export function resolveKeyboard(input: KeyboardInput): ResolveResult {
  if (input.isDefaultPrevented || input.isComposing) return EMPTY;
  if (input.isInspector || input.isCombobox) return EMPTY;

  const meta: InputMeta = {
    type: "KEYBOARD",
    key: input.key,
    code: input.canonicalKey,
    elementId: input.elementId,
  };

  const layers: (Layer | null)[] = [
    fieldLayer(input),
    triggerItemLayer(input),
    zoneLayer(input),
  ];

  for (const layer of layers) {
    if (!layer) continue;
    const result = layer(input.canonicalKey);
    if (!result) continue;
    if (result.commands.length === 1 && result.commands[0] === NOOP)
      return EMPTY;
    return {
      commands: result.commands,
      meta: { ...meta, elementId: result.elementId },
      preventDefault: true,
      fallback: false,
    };
  }

  return { commands: [], meta: null, preventDefault: false, fallback: true };
}

// ═══════════════════════════════════════════════════════════════════
// Layer Builders
// ═══════════════════════════════════════════════════════════════════

/** Layer 1: Field — editing text or always-active (boolean/number) */
function fieldLayer(input: KeyboardInput): Layer | null {
  if (input.editingFieldId) {
    return (key) => {
      const cmd = resolveFieldKey(input.editingFieldId!, key, {
        itemId: input.focusedItemId ?? undefined,
      });
      if (cmd)
        return { commands: [cmd], elementId: input.focusedItemId ?? undefined };
      // Field absorbs this key → NOOP
      if (input.isFieldActive) return { commands: [NOOP] };
      return null;
    };
  }

  if (input.activeFieldType && input.focusedItemId) {
    return (key) => {
      const cmd = resolveFieldKeyByType(input.activeFieldType!, key, {
        itemId: input.focusedItemId!,
      });
      return cmd ? { commands: [cmd], elementId: input.focusedItemId! } : null;
    };
  }

  return null;
}

/** Layers 2+3: Trigger > Item — chain executor */
function triggerItemLayer(input: KeyboardInput): Layer | null {
  if (input.isEditing) return null;

  const layers: Keymap[] = [];
  const hasTrigger =
    input.focusedTriggerId &&
    input.focusedTriggerRole &&
    input.focusedTriggerOverlayId;

  if (hasTrigger) {
    layers.push(
      buildTriggerKeymap(
        resolveTriggerRole(input.focusedTriggerRole!),
        {
          overlayId: input.focusedTriggerOverlayId!,
          triggerRole: input.focusedTriggerRole!,
          triggerId: input.focusedTriggerId!,
        },
        input.isTriggerOverlayOpen,
      ),
    );
  }

  // inputmap layer — direct key→command[] routing from APG table
  const inputmap = input.activeZoneInputmap;
  let hasInputmap = false;
  if (inputmap && input.activeZoneFocusedItemId) {
    for (const k in inputmap) {
      if (!isClickKey(k)) {
        hasInputmap = true;
        break;
      }
    }
  }

  if (hasInputmap) {
    // Build a single-command keymap for the chain resolver (trigger takes priority)
    const actionKeymap: Keymap = {};
    for (const k in inputmap) {
      if (isClickKey(k)) continue;
      const cmds = inputmap[k];
      if (cmds && cmds.length > 0) {
        actionKeymap[k] = cmds[0];
      }
    }
    layers.push(actionKeymap);
  }

  if (layers.length === 0) return null;

  return (key) => {
    // Check inputmap first for multi-command support (bypasses chain for full command list)
    if (hasInputmap && key in inputmap) {
      const cmds = inputmap[key];
      // Empty array = explicitly blocked key (e.g., checkbox Enter: [])
      // Return NOOP so the 3-layer loop stops here — prevents zoneLayer fallback
      if (!cmds || cmds.length === 0) return { commands: [NOOP] };
      // If trigger layer also has this key, trigger wins (chain priority)
      if (hasTrigger) {
        const triggerCmd = resolveChain(key, [layers[0]]);
        if (triggerCmd) {
          return { commands: [triggerCmd], elementId: input.focusedTriggerId! };
        }
      }
      // Return full command array from inputmap
      const elementId =
        input.activeZoneFocusedItemId ?? input.focusedItemId ?? undefined;
      return { commands: cmds, elementId };
    }

    // Fallback to chain resolution (trigger keys, etc.)
    const cmd = resolveChain(key, layers);
    if (!cmd) return null;
    const elementId = hasTrigger
      ? input.focusedTriggerId!
      : (input.activeZoneFocusedItemId ?? input.focusedItemId ?? undefined);
    return { commands: [cmd], elementId };
  };
}

/** Layer 4: Zone + Global — Keybindings registry */
function zoneLayer(input: KeyboardInput): Layer | null {
  return (key) => {
    const binding = Keybindings.resolve(key, {
      isEditing: input.isEditing,
      isFieldActive: input.isFieldActive,
    });
    if (!binding) return null;

    if (typeof binding.command === "function") {
      if (!input.cursor) return { commands: [NOOP] };
      const cmds = binding.command(input.cursor);
      const arr = Array.isArray(cmds) ? cmds : [cmds];
      return arr.length > 0
        ? { commands: arr, elementId: input.elementId }
        : null;
    }

    return { commands: [binding.command], elementId: input.elementId };
  };
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const EMPTY: ResolveResult = {
  commands: [],
  meta: null,
  preventDefault: false,
  fallback: false,
};

/** Click entries are handled by PointerListener, not keyboard. */
function isClickKey(k: string): boolean {
  return k === "click" || k.includes("+click");
}
