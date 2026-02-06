/**
 * routeField - Keyboard Pipeline Phase 3: Field Router
 *
 * Responsibility: Handle keyboard events within Field context.
 */

import { useCommandEngineStore } from '@os/features/command/store/CommandEngineStore';
import { OS_COMMANDS } from '@os/features/command/definitions/commandsShell';
import { FieldRegistry } from '@os/features/keyboard/registry/FieldRegistry';
import { logger } from '@os/app/debug/logger';
import type { KeyboardIntent } from '../../types';

/**
 * Route to Field handler (Enter/Escape/etc in Field context)
 */
export function routeField(intent: KeyboardIntent): boolean {
    const { canonicalKey, fieldId } = intent;
    if (!fieldId) return false;

    const dispatch = useCommandEngineStore.getState().getActiveDispatch();
    const fieldEntry = FieldRegistry.getField(fieldId);
    if (!fieldEntry) return false;

    const mode = fieldEntry.config.mode ?? 'immediate';
    const isEditing = fieldEntry.state.isEditing;
    const multiline = fieldEntry.config.multiline ?? false;

    logger.debug('KEYBOARD', '[P3:Route] Field:', { canonicalKey, fieldId, mode, isEditing });

    // IME: trap navigation keys
    if (intent.isComposing) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(canonicalKey)) {
            return true; // Just prevent propagation
        }
        if (canonicalKey === 'Enter') {
            return true; // Prevent Enter during composition
        }
        return false;
    }

    // Deferred mode logic
    if (mode === 'deferred') {
        if (canonicalKey === 'Escape' && isEditing) {
            dispatch?.({ type: OS_COMMANDS.FIELD_CANCEL, payload: { fieldId } });
            return true;
        }
        if (canonicalKey === 'Enter' && !multiline) {
            if (!isEditing) {
                dispatch?.({ type: OS_COMMANDS.FIELD_START_EDIT, payload: { fieldId } });
            } else {
                dispatch?.({ type: OS_COMMANDS.FIELD_COMMIT, payload: { fieldId } });
            }
            return true;
        }
        if (!isEditing) {
            return false; // Let other handlers process
        }
    }

    // Immediate mode / editing state
    if (canonicalKey === 'Enter' && !multiline) {
        dispatch?.({ type: OS_COMMANDS.FIELD_COMMIT, payload: { fieldId } });
        return true;
    }

    // Arrow trapping in multiline (only when editing)
    if (multiline && (canonicalKey === 'ArrowUp' || canonicalKey === 'ArrowDown')) {
        // Deferred mode, not editing: allow navigation passthrough
        if (mode === 'deferred' && !isEditing) {
            return false;
        }
        return true; // Trap but don't dispatch
    }

    // Horizontal arrows: trap only when editing
    if (canonicalKey === 'ArrowLeft' || canonicalKey === 'ArrowRight') {
        // Deferred mode, not editing: allow navigation passthrough
        if (mode === 'deferred' && !isEditing) {
            return false;
        }
        return true;
    }

    return false;
}
