/**
 * FocusSensor - Global DOM Focus Event Interceptor
 * Pipeline Phase 1: INTERCEPT
 * 
 * Responsibility: Capture DOM events and dispatch intents (FOCUS, SELECT).
 * Pure interceptor without local state or deduplication logic.
 * Logic is handled in the Resolve phase (FocusIntent).
 */

import { useEffect } from 'react';
import { useCommandEngineStore } from '@os/features/command/store/CommandEngineStore';
import { OS_COMMANDS } from '../../../command/definitions/commandsShell';
import { findFocusableItem, resolveFocusTarget } from '../../lib/focusDOMQueries';
import { logger } from '@os/app/debug/logger';

// Singleton: only first instance registers global listeners
let isMounted = false;

export function FocusSensor() {
    const isInitialized = useCommandEngineStore(s => s.isInitialized);

    useEffect(() => {
        // Singleton + initialization guard
        if (isMounted || !isInitialized) return;
        isMounted = true;

        const onEvent = (e: Event) => {
            logger.time('P1:Sense');
            logger.debug('FOCUS', `[P1:Sense] Event: ${e.type}`);
            const item = findFocusableItem(e.target as HTMLElement);
            if (!item) {
                logger.debug('FOCUS', '[P1:Sense] No focusable item found');
                return;
            }

            const target = resolveFocusTarget(item);
            if (!target) {
                logger.debug('FOCUS', '[P1:Sense] No target resolved');
                return;
            }
            logger.debug('FOCUS', '[P1:Sense] Target:', target);

            const isMouse = e instanceof MouseEvent;
            // Get dispatch at event time (not render time)
            const dispatch = useCommandEngineStore.getState().getActiveDispatch();

            if (isMouse && e.type === 'mousedown') {
                const me = e as MouseEvent;

                // --- Selection Logic (Click with Modifiers) ---
                if (me.shiftKey) {
                    me.preventDefault();
                    logger.debug('FOCUS', '[P1:Sense] Dispatch SELECT range');
                    dispatch?.({
                        type: OS_COMMANDS.SELECT,
                        payload: { targetId: target.itemId, mode: 'range', zoneId: target.zoneId }
                    });
                } else if (me.ctrlKey || me.metaKey) {
                    me.preventDefault();
                    logger.debug('FOCUS', '[P1:Sense] Dispatch SELECT toggle');
                    dispatch?.({
                        type: OS_COMMANDS.SELECT,
                        payload: { targetId: target.itemId, mode: 'toggle', zoneId: target.zoneId }
                    });
                } else {
                    // Standard Click -> Focus intent AND Select intent
                    // Clicking implies selecting the item (usually 'replace' mode, clearing others)
                    logger.debug('FOCUS', '[P1:Sense] Dispatch FOCUS + SELECT');

                    // 1. Move Focus
                    dispatch?.({
                        type: OS_COMMANDS.FOCUS,
                        payload: { id: target.itemId, zoneId: target.zoneId }
                    });

                    // 2. Update Selection
                    dispatch?.({
                        type: OS_COMMANDS.SELECT,
                        payload: { targetId: target.itemId, mode: 'replace', zoneId: target.zoneId }
                    });
                }
            } else if (e.type === 'focusin') {
                // Focus arrival (keyboard or follow-up to click)
                logger.debug('FOCUS', '[P1:Sense] Dispatch FOCUS (focusin)');
                dispatch?.({
                    type: OS_COMMANDS.FOCUS,
                    payload: { id: target.itemId, zoneId: target.zoneId }
                });
            }
            logger.timeEnd('FOCUS', 'P1:Sense');
        };

        // Capture phase for mousedown to handle it before most other handlers
        document.addEventListener('focusin', onEvent);
        document.addEventListener('mousedown', onEvent, { capture: true });

        return () => {
            isMounted = false;
            document.removeEventListener('focusin', onEvent);
            document.removeEventListener('mousedown', onEvent, { capture: true });
        };
    }, [isInitialized]);

    return null;
}
