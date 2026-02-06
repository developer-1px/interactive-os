import { useCommandEventBus } from "@os/features/command/lib/useCommandEventBus";
import { OS_COMMANDS } from "@os/features/command/definitions/commandsShell";
import { FocusData } from "@os/features/focus/lib/focusData";

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Dispatch command directly via the event bus */
export const dispatch = (command: { type: string; payload?: any }) => {
    console.log('[testUtils] dispatch:', command.type, command.payload);
    useCommandEventBus.getState().emit(command as any);
};

/** Navigate using OS_NAVIGATE command */
export const navigate = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    dispatch({
        type: OS_COMMANDS.NAVIGATE,
        payload: { direction, sourceId: null }
    });
};

/** Tab using OS_TAB command */
export const tab = (reverse = false) => {
    dispatch({
        type: reverse ? OS_COMMANDS.TAB_PREV : OS_COMMANDS.TAB
    });
};

/** 
 * Simulate click via OS commands only.
 * IMPORTANT: We do NOT dispatch DOM events or call el.focus() because:
 * - FocusSensor listens to mousedown/focusin and dispatches OS_FOCUS
 * - This would cause duplicate/conflicting OS_FOCUS commands
 * Instead, we dispatch commands directly to simulate the logical effect.
 */
export const click = (selector: string, modifiers: { ctrl?: boolean, shift?: boolean } = {}) => {
    const el = document.querySelector(selector);
    if (!(el instanceof HTMLElement)) {
        console.warn(`[testUtils] click(): Element not found: ${selector}`);
        return;
    }

    // Get zone information
    const zoneEl = el.closest('[data-focus-group]');
    const zoneId = zoneEl?.getAttribute('data-focus-group');
    const itemId = el.id;

    console.log(`[testUtils] click: selector=${selector}, itemId=${itemId}, zoneId=${zoneId}`);

    if (!itemId || !zoneId) {
        console.warn(`[testUtils] click(): Missing itemId (${itemId}) or zoneId (${zoneId}) for ${selector}`);
        return;
    }

    // Check if zone exists in registry
    const groupEntry = FocusData.getById(zoneId);
    console.log(`[testUtils] click: group entry exists=${!!groupEntry}`);

    // Dispatch OS_FOCUS command - this properly activates the zone through the pipeline
    dispatch({
        type: OS_COMMANDS.FOCUS,
        payload: {
            id: itemId,
            zoneId: zoneId,
        }
    });

    // Dispatch OS_SELECT with appropriate mode
    if (modifiers.ctrl || modifiers.shift) {
        const mode = modifiers.shift ? 'range' : 'toggle';
        dispatch({
            type: OS_COMMANDS.SELECT,
            payload: {
                targetId: itemId,
                zoneId,
                mode,
            }
        });
    } else {
        // Normal click = single selection
        dispatch({
            type: OS_COMMANDS.SELECT,
            payload: {
                targetId: itemId,
                zoneId,
                mode: 'single',
            }
        });
    }
};

/**
 * Simulate key press
 */
export const press = (key: string, modifiers: { shift?: boolean, ctrl?: boolean } = {}) => {
    const active = document.activeElement;
    const event = new KeyboardEvent('keydown', {
        key,
        code: key,
        bubbles: true,
        cancelable: true,
        shiftKey: modifiers.shift,
        ctrlKey: modifiers.ctrl,
        metaKey: modifiers.ctrl
    });
    active?.dispatchEvent(event);

    // For Escape, also dispatch OS_DISMISS
    if (key === 'Escape') {
        dispatch({ type: OS_COMMANDS.DISMISS });
    }
};

export const assert = (condition: boolean, message: string, logs: string[]) => {
    if (!condition) {
        logs.push(`❌ ${message}`);
        throw new Error(message);
    }
    logs.push(`✅ ${message}`);
};
