/**
 * Field Key Ownership — Per-key consumption table for field type presets.
 *
 * Principle: OS owns all keys by default. Fields opt-in to consume specific keys.
 *
 * The table maps each FieldType preset to the set of canonical key names
 * that the field "consumes" during editing (i.e., the OS should NOT handle them).
 * Any key NOT in the set is delegated to the OS for navigation/actions.
 *
 * Common keys consumed by ALL field types (not listed in table):
 *   - Letter/number/symbol keys → always consumed for typing (no keybinding match)
 *   - ArrowLeft, ArrowRight → cursor movement within text
 *   - Home, End → cursor jump within text
 *   - Backspace, Delete (when field has content) → delete character
 *   - Meta+Z, Meta+A, Meta+C/X/V → native browser behavior (undo, select, clipboard)
 *
 * These "base" keys are handled by the field inherently (browser default behavior)
 * and never have OS keybindings, so they don't need to be in the consume table.
 *
 * The table only lists keys that HAVE OS keybindings and need to be blocked:
 */

import type { FieldType } from "../6-components/primitives/FieldRegistry";

/**
 * Keys that each field type CONSUMES (blocks from OS).
 * If a canonical key is in this set, the OS treats the field as "editing" for that key.
 * If NOT in the set, the OS handles it normally (navigation, zone escape, etc.).
 */
const FIELD_CONSUMES: Record<FieldType, Set<string>> = {
    // inline: single-line input (draft, search, rename)
    // Consumes nothing extra — OS handles Tab, ↑↓, everything
    inline: new Set([]),

    // tokens: chip/tag input (email recipients, tags)
    // Like inline, but also delegates Backspace-when-empty to OS
    // (Backspace delegation is handled separately via isEmpty check)
    tokens: new Set([]),

    // block: multi-line text (comment, description, chat)
    // Consumes vertical arrows (cursor moves between lines)
    block: new Set([
        "ArrowUp",
        "ArrowDown",
        "Shift+ArrowUp",
        "Shift+ArrowDown",
    ]),

    // editor: code editor, rich text
    // Consumes vertical arrows + Tab (for indentation)
    editor: new Set([
        "ArrowUp",
        "ArrowDown",
        "Shift+ArrowUp",
        "Shift+ArrowDown",
        "Tab",
        "Shift+Tab",
    ]),
};

/**
 * Check if a specific key is consumed by the active field type.
 *
 * @param canonicalKey - The canonical key string (e.g., "Tab", "ArrowDown")
 * @param fieldType - The field type preset (defaults to "inline")
 * @returns true if the field consumes this key (OS should NOT handle it)
 */
export function isKeyConsumedByField(
    canonicalKey: string,
    fieldType: FieldType = "inline",
): boolean {
    return FIELD_CONSUMES[fieldType].has(canonicalKey);
}
