/**
 * FocusSensor - DOM Event → OS Command 변환기
 * Pipeline Phase 1: SENSE
 * 
 * 책임: DOM 이벤트를 감지하고 OS Command로 변환하여 dispatch
 * 순수함수/로직 처리는 FocusIntent에서 담당
 */

import { useEffect } from 'react';
import { useCommandEngineStore } from '@os/features/command/store/CommandEngineStore';
import { OS_COMMANDS } from '../../../command/definitions/commandsShell';
import { findFocusableItem, resolveFocusTarget } from '../../lib/focusDOMQueries';
import { isProgrammaticFocus } from '../5-sync/FocusSync';

let isMounted = false;

function sense(e: Event) {
    const item = findFocusableItem(e.target as HTMLElement);
    if (!item) return;

    const target = resolveFocusTarget(item);
    if (!target) return;

    const { itemId, groupId } = target;
    const dispatch = useCommandEngineStore.getState().getActiveDispatch();
    if (!dispatch) return;

    // MouseDown → FOCUS + SELECT
    if (e instanceof MouseEvent && e.type === 'mousedown') {
        if (e.shiftKey) {
            e.preventDefault();
            dispatch({ type: OS_COMMANDS.SELECT, payload: { targetId: itemId, mode: 'range', zoneId: groupId } });
            return;
        }
        if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            dispatch({ type: OS_COMMANDS.SELECT, payload: { targetId: itemId, mode: 'toggle', zoneId: groupId } });
            return;
        }
        dispatch({ type: OS_COMMANDS.FOCUS, payload: { id: itemId, zoneId: groupId } });
        dispatch({ type: OS_COMMANDS.SELECT, payload: { targetId: itemId, mode: 'replace', zoneId: groupId } });
        return;
    }

    // FocusIn → FOCUS
    if (e.type === 'focusin' && !isProgrammaticFocus) {
        dispatch({ type: OS_COMMANDS.FOCUS, payload: { id: itemId, zoneId: groupId } });
    }
}

export function FocusSensor() {
    const isInitialized = useCommandEngineStore(s => s.isInitialized);

    useEffect(() => {
        if (isMounted || !isInitialized) return;
        isMounted = true;

        document.addEventListener('focusin', sense);
        document.addEventListener('mousedown', sense, { capture: true });

        return () => {
            isMounted = false;
            document.removeEventListener('focusin', sense);
            document.removeEventListener('mousedown', sense, { capture: true });
        };
    }, [isInitialized]);

    return null;
}
