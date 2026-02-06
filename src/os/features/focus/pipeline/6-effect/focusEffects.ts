/**
 * focusEffects - Focus Side Effects
 * 
 * Pipeline Phase 6: EFFECT
 * Handles side effects triggered by focus state changes.
 * 
 * Responsibilities:
 * - Orchestrate state changes across zones
 * - Log telemetry for observability
 * - Dispatch bound app commands
 */

import { FocusRegistry } from '../../registry/FocusRegistry';
import { useCommandEngineStore } from '../../../command/store/CommandEngineStore';
import { CommandTelemetryStore } from '../../../command/store/CommandTelemetryStore';
import { commitAll, type FocusCommitPayload } from '../4-commit/commitFocus';
import type { FocusGroupStore } from '../../store/focusGroupStore';
import type { BaseCommand } from '@os/entities/BaseCommand';

export interface StateChange extends FocusCommitPayload {
    store?: FocusGroupStore;
    activeGroupId?: string;
    bindCommand?: BaseCommand;
    telemetry?: { command: string; payload: any };
}

/**
 * Apply a StateChange to the system.
 * Orchestrates: activeGroup → commit → telemetry → appCommand
 */
export function applyChange(change: StateChange, defaultStore: FocusGroupStore) {
    const store = change.store ?? defaultStore;

    // 1. Set active group if specified
    if (change.activeGroupId) {
        FocusRegistry.setActiveGroup(change.activeGroupId);
    }

    // 2. Commit state changes
    commitAll(store, change);

    // 3. Log telemetry
    if (change.telemetry) {
        CommandTelemetryStore.log(change.telemetry.command, change.telemetry.payload, 'os');
    }

    // 4. Dispatch bound app command
    if (change.bindCommand) {
        const dispatch = useCommandEngineStore.getState().getActiveDispatch();
        dispatch?.({
            type: change.bindCommand.type,
            payload: change.bindCommand.payload,
        });
    }
}
