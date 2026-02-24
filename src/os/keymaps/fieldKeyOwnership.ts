/**
 * Field Key Ownership — Zone pass-through keys per FieldType.
 *
 * ZIFT Keyboard Responder Chain:
 *   Field → Item → Zone → OS Global
 *
 * When a field is active (editing), it absorbs all keys by default.
 * Some keys are explicitly "passed through" to the Zone/OS layer —
 * navigation keys that should still work while editing.
 *
 * Design: "allowlist" model
 *   Only keys explicitly listed in ZONE_PASSTHROUGH_KEYS can pass
 *   from an active Field to the Zone layer. Everything else is absorbed.
 *
 * Keys always absorbed by Field (never pass through):
 *   - Letters/numbers/symbols → text input
 *   - ArrowLeft, ArrowRight → cursor movement
 *   - Home, End (without Meta) → cursor jump
 *   - Backspace, Delete → character deletion
 *   - Enter, Escape → handled by Field-layer (resolveFieldKey.ts)
 *   - Meta+Z/A/C/X/V → native browser behavior
 *
 * Keys that pass through to Zone (navigation):
 *   - Tab / Shift+Tab → zone escape (all field types, except editor)
 *   - ArrowUp / ArrowDown → item navigation (inline/tokens only)
 */

import type { FieldType } from "../6-components/field/FieldRegistry";
import { FieldRegistry } from "../6-components/field/FieldRegistry";

/**
 * Keys each FieldType allows to pass through to the Zone/OS layer during editing.
 *
 * If a key IS in this set → Zone layer can handle it (isFieldActive = false).
 * If NOT in this set → field absorbs it (isFieldActive = true, Zone skips).
 *
 * Note: Enter/Escape are NOT here — they are handled exclusively by
 * resolveFieldKey.ts at the Field layer. They never reach Zone/OS.
 */
const INLINE_ZONE_PASSTHROUGH = new Set([
  "Tab",
  "Shift+Tab",
  "ArrowUp",
  "ArrowDown",
  "Shift+ArrowUp",
  "Shift+ArrowDown",
]);

const ZONE_PASSTHROUGH_KEYS: Record<FieldType, Set<string>> = {
  // inline: single-line input (draft, search, rename)
  // Passes: Tab (zone escape), ↑↓ (item navigation)
  inline: INLINE_ZONE_PASSTHROUGH,

  // tokens: chip/tag input (email recipients, tags)
  tokens: INLINE_ZONE_PASSTHROUGH,

  // block: multi-line text (comment, description, chat)
  // ↑↓ moves cursor between lines → absorbed. Only Tab passes.
  block: new Set(["Tab", "Shift+Tab"]),

  // editor: code editor, rich text
  // Tab = indent. ↑↓ = cursor. Nothing passes.
  editor: new Set([]),
};

/**
 * Check if a key should pass through from an active Field to the Zone layer.
 *
 * @param canonicalKey - e.g., "Tab", "ArrowDown"
 * @param fieldType - Field type preset (defaults to "inline")
 * @returns true if the key passes through to Zone (isFieldActive = false)
 */
export function isKeyDelegatedToOS(
  canonicalKey: string,
  fieldType: FieldType = "inline",
): boolean {
  return ZONE_PASSTHROUGH_KEYS[fieldType].has(canonicalKey);
}

// ═══════════════════════════════════════════════════════════════════
// Shared helpers — used by KeyboardListener + macFallbackMiddleware
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if the target element is an editing element (DOM fallback).
 *
 * Used for elements NOT registered in FieldRegistry (e.g., plain textarea).
 * Unregistered elements absorb ALL keys — OS never intercepts.
 */
export function isEditingElement(target: HTMLElement): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

/**
 * Resolve whether a Field absorbs a specific key (isFieldActive).
 *
 * Process:
 *  1. If target element is registered in FieldRegistry:
 *     → use ZONE_PASSTHROUGH_KEYS for the field's type
 *  2. If NOT registered (plain textarea, native input):
 *     → treat as "owns all keys" (returns true, Zone blocked)
 *
 * Returns:
 *   true  = Field absorbs this key → Zone/OS skips it
 *   false = Key passes through to Zone/OS
 */
export function resolveIsEditingForKey(
  target: HTMLElement,
  canonicalKey: string,
): boolean {
  const fieldId = target.id || target.getAttribute("data-item-id");
  if (fieldId) {
    const fieldEntry = FieldRegistry.getField(fieldId);
    if (fieldEntry) {
      const fieldType = fieldEntry.config.fieldType ?? "inline";
      return !isKeyDelegatedToOS(canonicalKey, fieldType);
    }
  }
  // Unregistered element: absorbs all keys
  return isEditingElement(target);
}
