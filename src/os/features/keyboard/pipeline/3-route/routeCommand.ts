/**
 * routeCommand - Keyboard Pipeline Phase 3: Command Router
 *
 * Responsibility: Resolve keybinding and dispatch command.
 */

import { useCommandEngineStore } from '@os/features/command/store/CommandEngineStore';
import { FocusData } from '@os/features/focus/lib/focusData';
import { resolveKeybinding, buildBubblePath, type KeybindingEntry } from '@os/features/command/pipeline/2-resolve/resolveKeybinding';
import { dispatchCommand } from '@os/features/command/pipeline/3-dispatch/dispatchCommand';
import { runCommandEffects } from '@os/features/command/pipeline/4-effect/commandEffects';
import { useInputTelemetry } from '@os/app/debug/LoggedKey';
import { logger } from '@os/app/debug/logger';
import type { KeyboardIntent } from '../../types';

/**
 * Route to Command resolver (keybinding match + dispatch)
 */
export function routeCommand(intent: KeyboardIntent): boolean {
    const store = useCommandEngineStore.getState();
    const allBindings = store.getAllKeybindings() as KeybindingEntry[];

    if (allBindings.length === 0) return false;

    // Build context
    const focusPath = FocusData.getFocusPath();
    const activeGroupId = FocusData.getActiveZoneId();
    const activeZone = activeGroupId ? FocusData.getById(activeGroupId) : null;
    const focusedItemId = activeZone?.store?.getState().focusedItemId ?? null;

    const context = {
        activeGroup: activeGroupId ?? undefined,
        focusPath,
        focusedItemId,
        isInput: intent.isFromField,
    };

    const contextMap = store.getActiveContextMap();
    const state = store.getActiveState();
    const fullContext = contextMap && state !== undefined
        ? { ...context, ...contextMap(state, { activeGroupId, focusPath, focusedItemId }) }
        : context;

    const bubblePath = buildBubblePath(focusPath, activeGroupId);

    // Resolve keybinding
    const resolution = resolveKeybinding(
        { canonicalKey: intent.canonicalKey, isFromInput: intent.isFromField, target: intent.target, originalEvent: intent.originalEvent },
        allBindings,
        fullContext,
        bubblePath
    );

    if (!resolution) return false;

    logger.debug('KEYBOARD', '[P3:Route] Command resolved:', resolution.binding.command);

    // Dispatch
    const dispatchContext = {
        appDispatch: store.getActiveDispatch(),
        osRegistry: store.getOSRegistry()
    };

    const result = dispatchCommand(resolution, dispatchContext);
    runCommandEffects(result, resolution);

    // Telemetry
    useInputTelemetry.getState().logKey(
        intent.originalEvent as any,
        activeGroupId || 'global',
        true
    );

    return true;
}
