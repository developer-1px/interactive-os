/**
 * Field Key Ownership — Per-key delegation table for field type presets.
 *
 * Principle: When a field is editing, it OWNS all keys by default.
 * Fields explicitly DELEGATE specific navigation keys to the OS.
 *
 * This is the inverse of "consumption": instead of listing what fields block,
 * we list what fields release to OS for navigation/actions.
 *
 * Why delegation (not consumption)?
 *   Text input keys (Space, letters, numbers, punctuation) must NEVER be
 *   intercepted by OS navigating bindings during editing. The delegation model
 *   ensures only explicitly listed navigation keys can pass through to OS.
 *
 * Keys always handled by the field (never delegated):
 *   - Letter/number/symbol/Space → text input
 *   - ArrowLeft, ArrowRight → cursor movement within text
 *   - Home, End (without Meta) → cursor jump within text
 *   - Backspace, Delete → character deletion
 *   - Meta+Z, Meta+A, Meta+C/X/V → native browser behavior
 *
 * The table only contains keys that HAVE OS keybindings and should pass through:
 */

import type { FieldType } from "../6-components/field/FieldRegistry";
import { FieldRegistry } from "../6-components/field/FieldRegistry";

/**
 * Keys that each field type DELEGATES to the OS during editing.
 *
 * If a canonical key is in this set → the OS can handle it (isFieldActive = false).
 * If NOT in the set → the field owns it (isFieldActive = true, OS skips it).
 */
const INLINE_DELEGATES = new Set([
  "Tab",
  "Shift+Tab",
  "ArrowUp",
  "ArrowDown",
  "Shift+ArrowUp",
  "Shift+ArrowDown",
]);

const FIELD_DELEGATES_TO_OS: Record<FieldType, Set<string>> = {
  // inline: single-line input (draft, search, rename)
  // Delegates: Tab (zone escape), ↑↓ (item navigation)
  inline: INLINE_DELEGATES,

  // tokens: chip/tag input (email recipients, tags)
  // Same delegation as inline; Backspace∅→OS is handled separately when implemented
  tokens: INLINE_DELEGATES,

  // block: multi-line text (comment, description, chat)
  // Delegates Tab only (arrows move cursor between lines)
  block: new Set(["Tab", "Shift+Tab"]),

  // editor: code editor, rich text
  // Delegates nothing — editor handles Tab (indent) and ↑↓ (cursor)
  editor: new Set([]),
};

/**
 * Check if a specific key is delegated to the OS by the active field type.
 *
 * @param canonicalKey - The canonical key string (e.g., "Tab", "ArrowDown")
 * @param fieldType - The field type preset (defaults to "inline")
 * @returns true if the key is delegated to OS (isFieldActive = false)
 */
export function isKeyDelegatedToOS(
  canonicalKey: string,
  fieldType: FieldType = "inline",
): boolean {
  return FIELD_DELEGATES_TO_OS[fieldType].has(canonicalKey);
}

// ═══════════════════════════════════════════════════════════════════
// Shared helpers — single source of truth for KeyboardListener + macFallback
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if the target element is an editable element.
 * Fallback for elements NOT registered in FieldRegistry.
 */
export function isEditingElement(target: HTMLElement): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

/**
 * Resolve whether the field actively owns a specific key (isFieldActive).
 *
 * Returns true = field owns this key (OS should NOT handle)
 * Returns false = field delegates this key to OS (OS can handle)
 * Fallback: unregistered native inputs own all keys.
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
  return isEditingElement(target);
}
