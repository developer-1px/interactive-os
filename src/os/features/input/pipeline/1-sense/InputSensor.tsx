/**
 * InputSensor - Global DOM Input Event Interceptor
 * Pipeline Phase 1: INTERCEPT
 * 
 * Responsibility: Capture DOM input events and dispatch intents.
 * Follows FocusSensor pattern for global event interception.
 */

import { useEffect, useRef } from 'react';
import { useCommandEngineStore } from '@os/features/command/store/CommandEngineStore';
import { OS_COMMANDS } from '@os/features/command/definitions/commandsShell';
import { FieldRegistry } from '../../registry/FieldRegistry';
import { logger } from '@os/app/debug/logger';

// Singleton: only first instance registers global listeners
let isMounted = false;

// Track composition state globally
let isComposing = false;

/**
 * Resolve field ID from a DOM element
 */
function resolveFieldId(element: HTMLElement): string | null {
    // Check if element itself is a field
    if (element.getAttribute('role') === 'textbox' && element.id) {
        return element.id;
    }
    // Check parent (for nested contenteditable)
    const parent = element.closest('[role="textbox"]') as HTMLElement | null;
    return parent?.id || null;
}

/**
 * Check if element is a registered Field
 */
function isRegisteredField(fieldId: string): boolean {
    return FieldRegistry.getField(fieldId) !== undefined;
}

/**
 * Get field mode from data attribute
 */
function getFieldMode(element: HTMLElement): 'immediate' | 'deferred' {
    return (element.getAttribute('data-mode') as 'immediate' | 'deferred') || 'immediate';
}

/**
 * Check if field is currently editing
 */
function isFieldEditing(element: HTMLElement): boolean {
    return element.getAttribute('data-editing') === 'true';
}

/**
 * Check if field is multiline
 */
function isFieldMultiline(element: HTMLElement): boolean {
    return element.getAttribute('aria-multiline') === 'true';
}

export function InputSensor() {
    const isInitialized = useCommandEngineStore(s => s.isInitialized);

    useEffect(() => {
        if (isMounted || !isInitialized) return;
        isMounted = true;

        // --- Composition Events (IME) ---
        const onCompositionStart = () => {
            isComposing = true;
            logger.debug('INPUT', '[P1:InputSensor] Composition started');
        };

        const onCompositionEnd = () => {
            isComposing = false;
            logger.debug('INPUT', '[P1:InputSensor] Composition ended');
        };

        // --- Input Event ---
        const onInput = (e: Event) => {
            const target = e.target as HTMLElement;
            const fieldId = resolveFieldId(target);
            if (!fieldId || !isRegisteredField(fieldId)) return;

            const text = target.innerText;
            const dispatch = useCommandEngineStore.getState().getActiveDispatch();

            logger.debug('INPUT', '[P1:InputSensor] Input event', { fieldId, textLength: text.length });

            dispatch?.({
                type: OS_COMMANDS.FIELD_SYNC,
                payload: { fieldId, text }
            });
        };

        // --- Keydown Event ---
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const fieldId = resolveFieldId(target);
            if (!fieldId || !isRegisteredField(fieldId)) return;

            const dispatch = useCommandEngineStore.getState().getActiveDispatch();
            const mode = getFieldMode(target);
            const isEditing = isFieldEditing(target);
            const multiline = isFieldMultiline(target);

            // --- IME Handling ---
            if (isComposing || e.isComposing) {
                if (['Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.stopPropagation();
                }
                if (e.key === 'Enter') e.preventDefault();
                return;
            }

            // --- Deferred Mode Logic ---
            if (mode === 'deferred') {
                if (e.key === 'Escape' && isEditing) {
                    e.preventDefault();
                    e.stopPropagation();
                    logger.debug('INPUT', '[P1:InputSensor] Cancel (Escape)');
                    dispatch?.({ type: OS_COMMANDS.FIELD_CANCEL, payload: { fieldId } });
                    return;
                }

                if (e.key === 'Enter' && !multiline) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!isEditing) {
                        logger.debug('INPUT', '[P1:InputSensor] Start Edit (Enter)');
                        dispatch?.({ type: OS_COMMANDS.FIELD_START_EDIT, payload: { fieldId } });
                    } else {
                        logger.debug('INPUT', '[P1:InputSensor] Commit (Enter)');
                        dispatch?.({ type: OS_COMMANDS.FIELD_COMMIT, payload: { fieldId } });
                    }
                    return;
                }

                // If NOT editing in deferred mode, don't process further
                if (!isEditing) return;
            }

            // --- Immediate Mode / Editing State ---
            if (e.key === 'Enter') {
                if (!multiline) {
                    e.preventDefault();
                    logger.debug('INPUT', '[P1:InputSensor] Commit (Enter - immediate)');
                    dispatch?.({ type: OS_COMMANDS.FIELD_COMMIT, payload: { fieldId } });
                    return;
                } else {
                    e.stopPropagation(); // Allow newline in multiline
                }
            }

            // --- Arrow Navigation Trapping ---
            if (multiline && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.stopPropagation();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.stopPropagation();
            }
        };

        // --- Blur Event ---
        const onBlur = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            const fieldId = resolveFieldId(target);
            if (!fieldId || !isRegisteredField(fieldId)) return;

            const dispatch = useCommandEngineStore.getState().getActiveDispatch();

            logger.debug('INPUT', '[P1:InputSensor] Blur event', { fieldId });

            dispatch?.({
                type: OS_COMMANDS.FIELD_BLUR,
                payload: { fieldId }
            });
        };

        // --- Register Global Listeners ---
        document.addEventListener('compositionstart', onCompositionStart, true);
        document.addEventListener('compositionend', onCompositionEnd, true);
        document.addEventListener('input', onInput, true);
        document.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('blur', onBlur, true);

        return () => {
            isMounted = false;
            document.removeEventListener('compositionstart', onCompositionStart, true);
            document.removeEventListener('compositionend', onCompositionEnd, true);
            document.removeEventListener('input', onInput, true);
            document.removeEventListener('keydown', onKeyDown, true);
            document.removeEventListener('blur', onBlur, true);
        };
    }, [isInitialized]);

    return null;
}
