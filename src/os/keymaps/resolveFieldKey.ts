/**
 * resolveFieldKey — Field-layer key resolution
 *
 * Given a fieldId and a canonical key, returns the OS command that the
 * field layer should execute, or null if the field doesn't own this key
 * as an ACTION (i.e., the key passes through to the next ZIFT layer).
 *
 * This is the Field tier of the ZIFT keyboard responder chain:
 *   Field → Item → Zone → OS Global
 *
 * Pure function. No DOM access.
 */

import type { BaseCommand } from "@kernel";
import { OS_FIELD_COMMIT } from "@os/3-commands/field/commit";
import { OS_FIELD_CANCEL } from "@os/3-commands/field/cancel";
import { FieldRegistry, type FieldType } from "@os/6-components/field/FieldRegistry";

// ═══════════════════════════════════════════════════════════════════
// Field-layer keybindings per fieldType
// ═══════════════════════════════════════════════════════════════════

/**
 * Maps fieldType → key → OS command.
 *
 * Only keys that trigger an OS COMMAND are listed here.
 * Keys the field "owns" for text editing (e.g., Enter for newline in block)
 * are NOT listed — they return null, meaning "field absorbs, no OS action."
 *
 * Keys NOT listed here AND not in the "absorbed" set pass through to
 * the next ZIFT layer (Item → Zone → Global).
 */

type FieldKeymap = Record<string, () => BaseCommand>;

const INLINE_KEYMAP: FieldKeymap = {
    Enter: () => OS_FIELD_COMMIT(),
    Escape: () => OS_FIELD_COMMIT(),
};

const TOKENS_KEYMAP: FieldKeymap = {
    Enter: () => OS_FIELD_COMMIT(),
    Escape: () => OS_FIELD_COMMIT(),
};

const BLOCK_KEYMAP: FieldKeymap = {
    // Enter → NOT here (field owns = newline)
    Escape: () => OS_FIELD_COMMIT(),
};

const EDITOR_KEYMAP: FieldKeymap = {
    // Enter → NOT here (field owns = newline)
    // Tab → NOT here (field owns = indent)
    Escape: () => OS_FIELD_COMMIT(),
};

const FIELD_KEYMAPS: Record<FieldType, FieldKeymap> = {
    inline: INLINE_KEYMAP,
    tokens: TOKENS_KEYMAP,
    block: BLOCK_KEYMAP,
    editor: EDITOR_KEYMAP,
};

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a key press to a Field-layer command.
 *
 * @param fieldId - The FieldRegistry id of the active editing field, or null
 * @param canonicalKey - Canonical key string (e.g., "Enter", "Escape", "ArrowDown")
 * @returns BaseCommand if the field layer handles this key, null otherwise
 */
export function resolveFieldKey(
    fieldId: string | null,
    canonicalKey: string,
): BaseCommand | null {
    if (!fieldId) return null;

    const entry = FieldRegistry.getField(fieldId);
    if (!entry) return null;

    const fieldType = entry.config.fieldType ?? "inline";
    const keymap = FIELD_KEYMAPS[fieldType];
    const factory = keymap[canonicalKey];

    return factory ? factory() : null;
}
