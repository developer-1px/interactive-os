/**
 * KeyboardListener — DOM Adapter for keyboard events.
 *
 * Pipeline: KeyboardEvent → sense (DOM) → resolveKeyboard (pure) → dispatch
 *
 * W3C UI Events Module: Keyboard Events (§3.5)
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import {
  isEditingElement,
  resolveIsEditingForKey,
} from "@os/keymaps/fieldKeyOwnership";
import { getCanonicalKey } from "@os/keymaps/getCanonicalKey";
import { useEffect } from "react";
import { os } from "../../kernel";
import { type KeyboardInput, resolveKeyboard } from "./resolveKeyboard";

// Ensure OS defaults are registered
import "@os/keymaps/osDefaults";

// Register fallback middlewares (side-effect)
import { macFallbackMiddleware } from "@os/keymaps/macFallbackMiddleware";
import { typeaheadFallbackMiddleware } from "@os/keymaps/typeaheadFallbackMiddleware";

os.use(macFallbackMiddleware);
os.use(typeaheadFallbackMiddleware);

// ═══════════════════════════════════════════════════════════════════
// Sense: DOM → Data extraction
// ═══════════════════════════════════════════════════════════════════

function senseKeyboard(e: KeyboardEvent): KeyboardInput | null {
  const target = e.target as HTMLElement;
  if (!target) return null;

  const canonicalKey = getCanonicalKey(e);

  // DOM queries for focus context
  const focusedEl = document.activeElement as HTMLElement | null;
  const itemEl = focusedEl?.closest?.("[data-item-id]") as HTMLElement | null;

  // Zone state for CHECK resolution
  const focusState = os.getState().os?.focus;
  const activeZoneId = focusState?.activeZoneId;
  const entry = activeZoneId ? ZoneRegistry.get(activeZoneId) : null;
  const zone = activeZoneId ? focusState?.zones?.[activeZoneId] : null;

  const isEditing = isEditingElement(target);

  // Field layer: editing field id (from OS state, not DOM)
  const editingFieldId = zone?.editingItemId ?? null;

  // Item layer: expanded state
  const focusedItemId = itemEl?.id ?? null;
  const focusedItemExpanded = focusedItemId && zone?.expandedItems
    ? zone.expandedItems.includes(focusedItemId)
    : null;

  return {
    canonicalKey,
    key: e.key,
    isEditing,
    isFieldActive: isEditing
      ? resolveIsEditingForKey(target, canonicalKey)
      : false,
    isComposing: e.isComposing || e.keyCode === 229,
    isDefaultPrevented: e.defaultPrevented,
    isInspector: !!target.closest("[data-inspector]"),
    isCombobox:
      target instanceof HTMLInputElement &&
      target.getAttribute("role") === "combobox",
    editingFieldId,
    focusedItemRole: itemEl?.getAttribute("role") ?? null,
    focusedItemId,
    focusedItemExpanded,
    activeZoneHasCheck: !!entry?.onCheck,
    activeZoneFocusedItemId: zone?.focusedItemId ?? null,
    elementId:
      target.getAttribute("data-id") ??
      target.getAttribute("data-zone-id") ??
      target.id ??
      undefined,
    cursor: zone?.focusedItemId
      ? {
        focusId: zone.focusedItemId,
        selection: zone.selection ?? [],
        anchor: zone.selectionAnchor ?? null,
      }
      : null,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function KeyboardListener() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const input = senseKeyboard(e);
      if (!input) return;

      const result = resolveKeyboard(input);

      if (result.commands.length > 0) {
        for (const cmd of result.commands) {
          const opts = result.meta
            ? {
              meta: {
                input: result.meta,
                pipeline: {
                  sensed: input,
                  resolved: {
                    fallback: result.fallback,
                    preventDefault: result.preventDefault,
                  },
                },
              },
            }
            : undefined;
          os.dispatch(cmd, opts);
        }
      }

      if (result.fallback) {
        if (os.resolveFallback(e)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }

      if (result.preventDefault) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  return null;
}

KeyboardListener.displayName = "KeyboardListener";
