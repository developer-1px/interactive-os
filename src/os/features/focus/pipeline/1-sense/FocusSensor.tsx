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
import { isProgrammaticFocus } from '../5-sync/FocusSync';
import { logger } from '@os/app/debug/logger';

// Singleton: only first instance registers global listeners
let isMounted = false;

// Track last processed target to prevent duplicate focus events
let lastProcessedTarget: { itemId: string; zoneId: string; timestamp: number } | null = null;
const DEDUP_WINDOW_MS = 50; // Ignore duplicate events within 50ms

export function FocusSensor() {
    const isInitialized = useCommandEngineStore(s => s.isInitialized);

    useEffect(() => {
        // Singleton + initialization guard
        if (isMounted || !isInitialized) return;
        isMounted = true;

        const onEvent = (e: Event) => {
            const eventTarget = e.target as HTMLElement;
            logger.debug('FOCUS', `[P1:Sense] Event: ${e.type}`, {
                target: eventTarget.id || eventTarget.tagName,
                className: eventTarget.className?.slice?.(0, 50)
            });

            const item = findFocusableItem(eventTarget);
            if (!item) {
                logger.debug('FOCUS', '[P1:Sense] No focusable item found');
                return;
            }

            const target = resolveFocusTarget(item);
            if (!target) {
                logger.debug('FOCUS', '[P1:Sense] No target resolved');
                return;
            }
            logger.debug('FOCUS', '[P1:Sense] Resolved target:', target);

            const isMouse = e instanceof MouseEvent;
            // Get dispatch at event time (not render time)
            const dispatch = useCommandEngineStore.getState().getActiveDispatch();

            if (isMouse && e.type === 'mousedown') {
                const me = e as MouseEvent;

                // Track this as processed (for dedup against focusin)
                lastProcessedTarget = {
                    itemId: target.itemId,
                    zoneId: target.zoneId,
                    timestamp: Date.now()
                };

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
                    logger.debug('FOCUS', '[P1:Sense] Dispatch FOCUS + SELECT', target);

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
                // Skip if this focusin was triggered by FocusSync's programmatic focus()
                if (isProgrammaticFocus) {
                    logger.debug('FOCUS', '[P1:Sense] Skipping focusin (programmatic focus from FocusSync)');
                    return;
                }

                // Deduplicate: Skip if we just processed the same target via mousedown
                const now = Date.now();
                if (lastProcessedTarget &&
                    lastProcessedTarget.itemId === target.itemId &&
                    lastProcessedTarget.zoneId === target.zoneId &&
                    (now - lastProcessedTarget.timestamp) < DEDUP_WINDOW_MS
                ) {
                    logger.debug('FOCUS', '[P1:Sense] Skipping duplicate focusin (already processed via mousedown)');
                    return;
                }

                // Focus arrival (keyboard navigation or programmatic focus)
                logger.debug('FOCUS', '[P1:Sense] Dispatch FOCUS (focusin)', target);
                dispatch?.({
                    type: OS_COMMANDS.FOCUS,
                    payload: { id: target.itemId, zoneId: target.zoneId }
                });
            }
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
