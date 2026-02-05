/**
 * GlobalFocusSensor - Global DOM Focus Event Interceptor
 * Pipeline Phase 1: INTERCEPT
 * 
 * Responsibility: Capture DOM events and dispatch intents (FOCUS, SELECT).
 * Pure interceptor without local state or deduplication logic.
 * Logic is handled in the Resolve phase (FocusCommandHandler).
 */

import { useEffect } from 'react';
import { useCommandEngine } from '../../../command/ui/CommandContext';
import { OS_COMMANDS } from '../../../command/definitions/commandsShell';
import { findFocusableItem, resolveFocusTarget } from '../../lib/focusDOMQueries';

export function GlobalFocusSensor() {
    const { dispatch } = useCommandEngine();

    useEffect(() => {
        const onEvent = (e: Event) => {
            const item = findFocusableItem(e.target as HTMLElement);
            if (!item) return;

            const target = resolveFocusTarget(item);
            if (!target) return;

            const isMouse = e instanceof MouseEvent;

            if (isMouse && e.type === 'mousedown') {
                const me = e as MouseEvent;

                // --- Selection Logic (Click with Modifiers) ---
                if (me.shiftKey) {
                    me.preventDefault(); // Prevent text selection
                    dispatch({
                        type: OS_COMMANDS.SELECT,
                        payload: { targetId: target.itemId, mode: 'range', zoneId: target.zoneId }
                    });
                } else if (me.ctrlKey || me.metaKey) {
                    me.preventDefault();
                    dispatch({
                        type: OS_COMMANDS.SELECT,
                        payload: { targetId: target.itemId, mode: 'toggle', zoneId: target.zoneId }
                    });
                } else {
                    // Standard Click -> Focus intent
                    dispatch({
                        type: OS_COMMANDS.FOCUS,
                        payload: { id: target.itemId, zoneId: target.zoneId }
                    });
                }
            } else if (e.type === 'focusin') {
                // Focus arrival (keyboard or follow-up to click)
                dispatch({
                    type: OS_COMMANDS.FOCUS,
                    payload: { id: target.itemId, zoneId: target.zoneId }
                });
            }
        };

        // Capture phase for mousedown to handle it before most other handlers
        document.addEventListener('focusin', onEvent);
        document.addEventListener('mousedown', onEvent, { capture: true });

        return () => {
            document.removeEventListener('focusin', onEvent);
            document.removeEventListener('mousedown', onEvent, { capture: true });
        };
    }, [dispatch]);

    return null;
}
