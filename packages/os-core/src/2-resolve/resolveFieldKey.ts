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
import { OS_FIELD_CANCEL } from "@os-core/4-command/field/cancel";
import { OS_FIELD_COMMIT } from "@os-core/4-command/field/commit";
import { OS_VALUE_CHANGE } from "@os-core/4-command/valueChange";
import {
  FieldRegistry,
  type FieldType,
} from "@os-core/engine/registries/fieldRegistry";

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

/** Context passed to Field keymap factories */
export interface FieldKeyContext {
  /** The focused item's ID — used for targetId in OS_CHECK etc. */
  itemId?: string;
}

/**
 * Maps ARIA role → FieldType for always-active Fields.
 * Used by sense adapters (browser + headless) to set activeFieldType.
 *
 * Only roles that imply an always-active Field are listed.
 * Text Fields (role=textbox) are NOT here — they use editingFieldId lifecycle.
 */
export const ROLE_FIELD_TYPE_MAP: Readonly<Record<string, FieldType>> = {
  // switch/checkbox: removed — action.commands=[OS_CHECK()] handles Space/Enter via Zone layer
  slider: "number",
  radio: "enum",
  option: "enum",
  progressbar: "readonly",
  meter: "readonly",
};

type FieldKeymap = Record<string, (ctx: FieldKeyContext) => BaseCommand>;

const INLINE_KEYMAP: FieldKeymap = {
  Enter: () => OS_FIELD_COMMIT(),
  Escape: () => OS_FIELD_CANCEL(),
};

const TOKENS_KEYMAP: FieldKeymap = {
  Enter: () => OS_FIELD_COMMIT(),
  Escape: () => OS_FIELD_CANCEL(),
};

const BLOCK_KEYMAP: FieldKeymap = {
  // Enter → NOT here (field owns = newline)
  Escape: () => OS_FIELD_CANCEL(),
};

const EDITOR_KEYMAP: FieldKeymap = {
  // Enter → NOT here (field owns = newline)
  // Tab → NOT here (field owns = indent)
  Escape: () => OS_FIELD_CANCEL(),
};

// ─── number: slider, spinbutton ───
// Arrow/Home/End/Page → OS_VALUE_CHANGE (adjust value)
const NUMBER_KEYMAP: FieldKeymap = {
  ArrowRight: () => OS_VALUE_CHANGE({ action: "increment" }),
  ArrowUp: () => OS_VALUE_CHANGE({ action: "increment" }),
  ArrowLeft: () => OS_VALUE_CHANGE({ action: "decrement" }),
  ArrowDown: () => OS_VALUE_CHANGE({ action: "decrement" }),
  Home: () => OS_VALUE_CHANGE({ action: "setMin" }),
  End: () => OS_VALUE_CHANGE({ action: "setMax" }),
  PageUp: () => OS_VALUE_CHANGE({ action: "incrementLarge" }),
  PageDown: () => OS_VALUE_CHANGE({ action: "decrementLarge" }),
};

const FIELD_KEYMAPS: Record<FieldType, FieldKeymap> = {
  inline: INLINE_KEYMAP,
  tokens: TOKENS_KEYMAP,
  block: BLOCK_KEYMAP,
  editor: EDITOR_KEYMAP,
  number: NUMBER_KEYMAP,
  // enum/enum[]: Zone+Item composition handles all keys.
  // Empty keymap — Field layer never intercepts. Zone navigation + Item selection.
  enum: {},
  "enum[]": {},
  // readonly: observation only (progressbar, meter). No interaction.
  readonly: {},
};

// ═══════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a key press to a Field-layer command.
 *
 * @param fieldId - The FieldRegistry id of the active editing field, or null
 * @param canonicalKey - Canonical key string (e.g., "Enter", "Escape", "ArrowDown")
 * @param context - Optional context (itemId for targetId in CHECK/VALUE commands)
 * @returns BaseCommand if the field layer handles this key, null otherwise
 */
export function resolveFieldKey(
  fieldId: string | null,
  canonicalKey: string,
  context?: FieldKeyContext,
): BaseCommand | null {
  if (!fieldId) return null;

  const entry = FieldRegistry.getField(fieldId);
  if (!entry) return null;

  const fieldType = entry.config.fieldType ?? "inline";
  return resolveFieldKeyByType(fieldType, canonicalKey, context);
}

/**
 * Resolve a key press by fieldType directly (no FieldRegistry lookup).
 *
 * Used for boolean/number Fields that are always active:
 * these don't require editingFieldId — focus alone activates the Field layer.
 */
export function resolveFieldKeyByType(
  fieldType: FieldType,
  canonicalKey: string,
  context?: FieldKeyContext,
): BaseCommand | null {
  const keymap = FIELD_KEYMAPS[fieldType];
  const factory = keymap[canonicalKey];
  return factory ? factory(context ?? {}) : null;
}
