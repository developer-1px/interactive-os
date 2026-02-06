/**
 * classifyKeyboard - Keyboard Pipeline Phase 2: CLASSIFY
 *
 * Responsibility: Determine the processing path for a KeyboardIntent.
 *
 * Priority Order:
 * 1. FIELD - If in editing Field and key should be handled by Field
 * 2. COMMAND - If keybinding exists for this key (includes navigation)
 * 3. PASSTHRU - Let browser handle
 */

import { useCommandEngineStore } from '@os/features/command/store/CommandEngineStore';
import { FieldRegistry } from '@os/features/keyboard/registry/FieldRegistry';
import { normalizeKeyDefinition } from '@os/features/keyboard/lib/getCanonicalKey';
import type { KeyboardIntent, KeyboardCategory } from '../../types';

// Keys that Fields handle internally when editing
const FIELD_KEYS = new Set([
    'Enter', 'Escape',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Backspace', 'Delete',
]);

/**
 * Classify a KeyboardIntent into a processing category.
 */
export function classifyKeyboard(intent: KeyboardIntent): KeyboardCategory {
    const { canonicalKey, isFromField, isComposing, fieldId } = intent;

    // IME composition: always FIELD or PASSTHRU
    if (isComposing) {
        return isFromField ? 'FIELD' : 'PASSTHRU';
    }

    // --- Priority 1: Field handling ---
    if (isFromField && fieldId) {
        const fieldEntry = FieldRegistry.getField(fieldId);
        if (fieldEntry) {
            const mode = fieldEntry.config.mode ?? 'immediate';
            // immediate mode: always editing when focused
            // deferred mode: only editing when isEditing flag is true
            const isEditing = mode === 'immediate' || fieldEntry.state.isEditing;
            const multiline = fieldEntry.config.multiline ?? false;

            if (isEditing) {
                // ArrowUp/Down: only trap in multiline fields
                if (canonicalKey === 'ArrowUp' || canonicalKey === 'ArrowDown') {
                    if (multiline) {
                        return 'FIELD';  // Cursor movement in multiline
                    }
                    // single-line: fall through to COMMAND for zone navigation
                }
                // ArrowLeft/Right: always Field (cursor movement)
                else if (canonicalKey === 'ArrowLeft' || canonicalKey === 'ArrowRight') {
                    return 'FIELD';
                }
                // Other Field keys (Enter, Escape, Backspace, Delete)
                else if (FIELD_KEYS.has(canonicalKey)) {
                    return 'FIELD';
                }
                // Single character input (no modifier)
                if (canonicalKey.length === 1 && !hasModifier(canonicalKey)) {
                    return 'FIELD';
                }
            }

            // Deferred mode, not editing: Enter starts edit
            if (mode === 'deferred' && !fieldEntry.state.isEditing && canonicalKey === 'Enter') {
                return 'FIELD';
            }
        }
    }

    // --- Priority 2: Native Browser Shortcuts (Copy/Paste/Cut/Select All) ---
    // Always allow these to pass through for native browser handling
    const NATIVE_SHORTCUTS = ['Meta-c', 'Meta-v', 'Meta-x', 'Meta-a', 'Ctrl-c', 'Ctrl-v', 'Ctrl-x', 'Ctrl-a'];
    if (NATIVE_SHORTCUTS.includes(canonicalKey)) {
        return 'PASSTHRU';
    }

    // --- Priority 3: Command (Keybinding) ---
    // All navigation keys are registered as keybindings in useOSCore
    if (hasKeybinding(canonicalKey)) {
        return 'COMMAND';
    }

    // --- Priority 4: Passthrough ---
    return 'PASSTHRU';
}

/**
 * Check if a keybinding exists for this key.
 */
function hasKeybinding(canonicalKey: string): boolean {
    const allBindings = useCommandEngineStore.getState().getAllKeybindings() ?? [];
    return allBindings.some(
        (b: { key: string }) => normalizeKeyDefinition(b.key) === canonicalKey
    );
}

/**
 * Check if the key includes a modifier.
 */
function hasModifier(canonicalKey: string): boolean {
    return canonicalKey.includes('+');
}
