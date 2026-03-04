/**
 * resolveKeyboard — Pure keyboard event resolution
 *
 * ZIFT Responder Chain: Field → Trigger → Item → Zone
 * Each layer is a function. First claim wins.
 *
 * @see design-principles.md #23 (ordered keymap chain)
 * @see design-principles.md #24 (binary return: Command/NOOP = stop, null = pass)
 */

import { resolveChain, NOOP, type Keymap } from "@os-core/2-resolve/chainResolver";
import { Keybindings } from "@os-core/2-resolve/keybindings";
import {
  resolveFieldKey,
  resolveFieldKeyByType,
} from "@os-core/2-resolve/resolveFieldKey";
import type { BaseCommand } from "@kernel/core/tokens";
import type { FieldType } from "@os-core/engine/registries/fieldRegistry";
import {
  resolveTriggerRole,
  buildTriggerKeymap,
} from "@os-core/engine/registries/triggerRegistry";
import type { ZoneCursor } from "@os-core/engine/registries/zoneRegistry";
import type { ActionConfig } from "@os-core/schema/types";
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
  /** action config — single route for all command-driven keys */
  activeZoneAction: ActionConfig | null;

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

/** Layer return: command + which element claimed it */
interface LayerResult {
  cmd: BaseCommand;
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
    if (result.cmd === NOOP) return EMPTY;
    return {
      commands: [result.cmd],
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
      if (cmd) return { cmd, elementId: input.focusedItemId ?? undefined };
      // Field absorbs this key → NOOP
      if (input.isFieldActive) return { cmd: NOOP };
      return null;
    };
  }

  if (input.activeFieldType && input.focusedItemId) {
    return (key) => {
      const cmd = resolveFieldKeyByType(input.activeFieldType!, key, {
        itemId: input.focusedItemId!,
      });
      return cmd ? { cmd, elementId: input.focusedItemId! } : null;
    };
  }

  return null;
}

/** Layers 2+3: Trigger > Item — chain executor */
function triggerItemLayer(input: KeyboardInput): Layer | null {
  if (input.isEditing) return null;

  const layers: Keymap[] = [];
  const hasTrigger = input.focusedTriggerId && input.focusedTriggerRole && input.focusedTriggerOverlayId;

  if (hasTrigger) {
    layers.push(
      buildTriggerKeymap(resolveTriggerRole(input.focusedTriggerRole!), {
        overlayId: input.focusedTriggerOverlayId!,
        triggerRole: input.focusedTriggerRole!,
        triggerId: input.focusedTriggerId!,
      }, input.isTriggerOverlayOpen),
    );
  }

  // Action config keymap (v10) — BEFORE legacy check
  if (input.activeZoneAction && input.activeZoneFocusedItemId) {
    const action = input.activeZoneAction;
    const keys = action.keys ?? [];

    const actionKeymap: Keymap = {};

    for (const k of keys) {
      if (action.keymap?.[k as keyof typeof action.keymap]) {
        const overrideCmds = action.keymap[k as keyof typeof action.keymap]!;
        actionKeymap[k] = overrideCmds[0];
      } else if (action.commands.length > 0) {
        actionKeymap[k] = action.commands[0];
      }
    }

    if (action.keymap) {
      for (const [k, cmds] of Object.entries(action.keymap)) {
        if (!actionKeymap[k] && cmds && cmds.length > 0) {
          actionKeymap[k] = cmds[0];
        }
      }
    }

    layers.push(actionKeymap);
  }

  if (layers.length === 0) return null;

  return (key) => {
    const cmd = resolveChain(key, layers);
    if (!cmd) return null;
    const elementId = hasTrigger
      ? input.focusedTriggerId!
      : input.activeZoneFocusedItemId ?? input.focusedItemId ?? undefined;
    return { cmd, elementId };
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
      if (!input.cursor) return { cmd: NOOP };
      const cmds = binding.command(input.cursor);
      // ZoneCallback returns command(s) — wrap first one
      const arr = Array.isArray(cmds) ? cmds : [cmds];
      return arr.length > 0 ? { cmd: arr[0], elementId: input.elementId } : null;
    }

    return { cmd: binding.command, elementId: input.elementId };
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
