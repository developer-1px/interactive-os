/**
 * KeyboardListener — Single-component keyboard handler for the kernel.
 *
 * Pipeline: KeyboardEvent → getCanonicalKey → Keybindings.resolve → kernel.dispatch
 *
 * The kernel's static scope tree handles bubbling automatically.
 * Commands from scoped groups carry their scope; the kernel auto-expands
 * via parentMap. Global commands go directly to GLOBAL.
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_CHECK } from "@os/3-commands/interaction";
import {
  isEditingElement,
  resolveIsEditingForKey,
} from "@os/keymaps/fieldKeyOwnership";
import { getCanonicalKey } from "@os/keymaps/getCanonicalKey";
import { Keybindings } from "@os/keymaps/keybindings";
import { useEffect } from "react";
import { kernel } from "../kernel";

// Ensure OS defaults are registered
import "@os/keymaps/osDefaults";

// Register Mac fallback middleware (side-effect)
import { macFallbackMiddleware } from "@os/keymaps/macFallbackMiddleware";
import { typeaheadFallbackMiddleware } from "@os/keymaps/typeaheadFallbackMiddleware";

kernel.use(macFallbackMiddleware);
kernel.use(typeaheadFallbackMiddleware);

/**
 * Combobox inputs (e.g. QuickPick) are self-managed:
 * they dispatch kernel commands directly from their own keydown handler.
 * The global KeyboardListener should skip them to avoid conflict.
 */
function isComboboxInput(target: HTMLElement): boolean {
  return (
    target instanceof HTMLInputElement &&
    target.getAttribute("role") === "combobox"
  );
}
function buildInputMeta(
  e: KeyboardEvent,
  canonicalKey: string,
  target: HTMLElement,
) {
  return {
    type: "KEYBOARD" as const,
    key: e.key,
    code: canonicalKey,
    elementId:
      target.getAttribute("data-id") ||
      target.getAttribute("data-zone-id") ||
      target.id ||
      undefined,
  };
}

/**
 * W3C APG: Space on checkbox/switch → CHECK, not SELECT.
 * Returns true if the event was handled (dispatched + prevented).
 */
function tryDispatchCheck(e: KeyboardEvent, canonicalKey: string): boolean {
  const focusedEl = document.activeElement as HTMLElement | null;
  const itemEl = focusedEl?.closest?.("[data-item-id]") as HTMLElement | null;
  const role = itemEl?.getAttribute("role");

  // Case 1: Explicit checkbox/switch role → always CHECK
  if (role === "checkbox" || role === "switch") {
    const itemId = itemEl?.id;
    if (itemId) {
      kernel.dispatch(OS_CHECK({ targetId: itemId }), {
        meta: {
          input: {
            type: "KEYBOARD",
            key: e.key,
            code: canonicalKey,
            elementId: itemId,
          },
        },
      });
      return true;
    }
  }

  // Case 2: Active zone has onCheck registered → CHECK (app semantics)
  const focusState = kernel.getState().os?.focus;
  const activeZoneId = focusState?.activeZoneId;
  if (activeZoneId) {
    const entry = ZoneRegistry.get(activeZoneId);
    if (entry?.onCheck) {
      const zone = focusState?.zones?.[activeZoneId];
      const targetId = zone?.focusedItemId;
      if (targetId) {
        kernel.dispatch(OS_CHECK({ targetId }), {
          meta: {
            input: {
              type: "KEYBOARD",
              key: e.key,
              code: canonicalKey,
              elementId: targetId,
            },
          },
        });
        return true;
      }
    }
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function KeyboardListener() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // IME guard: isComposing catches most cases, but Chrome dispatches
      // the FIRST keydown of Korean IME with isComposing=false (compositionstart
      // fires AFTER keydown). keyCode 229 is the standard IME processing signal.
      if (e.defaultPrevented || e.isComposing || e.keyCode === 229) return;

      const target = e.target as HTMLElement;
      if (!target || target.closest("[data-inspector]")) return;

      // Combobox inputs dispatch kernel commands from their own handler.
      if (isComboboxInput(target)) return;

      const canonicalKey = getCanonicalKey(e);

      // Dual context for Key Ownership Model:
      // - isEditing: is the element an editing element? (Enter→FIELD_COMMIT, Escape→FIELD_CANCEL)
      // - isFieldActive: does the field consume this specific key? (Tab, Arrow → may pass through)
      const isEditing = isEditingElement(target);
      const isFieldActive = isEditing
        ? resolveIsEditingForKey(target, canonicalKey)
        : false;

      // Space on checkbox/switch → CHECK override (W3C APG)
      // Must use isEditing (not isFieldActive): Space is always text input when editing
      if (canonicalKey === "Space" && !isEditing) {
        if (tryDispatchCheck(e, canonicalKey)) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // Resolve keybinding with dual context
      const binding = Keybindings.resolve(canonicalKey, {
        isEditing,
        isFieldActive,
      });

      if (!binding) {
        // No keybinding → try middleware fallback
        if (kernel.resolveFallback(e)) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      // Dispatch command — kernel handles everything (including Tab)
      const command = binding.command(...(binding.args ?? []));
      kernel.dispatch(command, {
        meta: { input: buildInputMeta(e, canonicalKey, target) },
      });

      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  return null;
}

KeyboardListener.displayName = "KeyboardListener";
