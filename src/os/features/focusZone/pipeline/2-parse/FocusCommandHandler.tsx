/**
 * FocusCommandHandler - Global Focus Command Handler
 * 
 * Single source of truth for handling all focus-related OS commands.
 * 
 * Pipeline Phase 2: PARSE / ORCHESTRATE
 * Processes commands into resolved state changes.
 */

import { useCommandListener } from '../../../command/hooks/useCommandListener';
import { OS_COMMANDS, type OSNavigatePayload, type OSSelectPayload, type OSActivatePayload } from '../../../command/definitions/commandsShell';
import { GlobalZoneRegistry } from '../../registry/GlobalZoneRegistry';
import { resolveNavigate } from '../3-resolve/resolveNavigate';
import { resolveTab } from '../3-resolve/resolveTab';
import { resolveSelect } from '../3-resolve/resolveSelect';
import { resolveActivate } from '../3-resolve/resolveActivate';
import { commitAll } from '../4-commit/commitFocus';
import { ZoneOrchestrator } from '../ZoneOrchestrator';

// ═══════════════════════════════════════════════════════════════════
// Command Handlers
// ═══════════════════════════════════════════════════════════════════

function handleNavigate(payload: unknown) {
    const entry = GlobalZoneRegistry.getActiveZoneEntry();
    if (!entry || !entry.config) return;

    const { store } = entry;
    const config = entry.config; // Explicit capture for type safety
    const state = store.getState();
    const { direction } = payload as OSNavigatePayload;
    const dir = direction.toLowerCase() as 'up' | 'down' | 'left' | 'right';

    const result = resolveNavigate(
        state.focusedItemId,
        dir,
        state.items,
        config.navigate,
        { stickyX: state.stickyX, stickyY: state.stickyY }
    );

    commitAll(store, {
        targetId: result.targetId,
        stickyX: result.stickyX,
        stickyY: result.stickyY,
    });

    // Follow-focus selection
    if (config.select.followFocus && result.targetId) {
        commitAll(store, {
            selection: [result.targetId],
            anchor: result.targetId,
        });
    }
}

function handleTab(direction: 'forward' | 'backward') {
    const entry = GlobalZoneRegistry.getActiveZoneEntry();
    if (!entry || !entry.config) return;

    const { store } = entry;
    const config = entry.config;
    const state = store.getState();

    const result = resolveTab(
        state.focusedItemId,
        direction,
        state.items,
        config.tab
    );

    if (result.action === 'trap' && result.targetId) {
        commitAll(store, { targetId: result.targetId });
    } else if (result.action === 'escape' || result.action === 'flow') {
        ZoneOrchestrator.traverseZone(state.zoneId, direction, config);
    }
}

function handleSelect(payload: unknown) {
    const entry = GlobalZoneRegistry.getActiveZoneEntry();
    if (!entry || !entry.config) return;

    const { store } = entry;
    const config = entry.config;
    const state = store.getState();
    const { mode, targetId } = payload as OSSelectPayload;

    const resolveMode = (mode === 'replace' || !mode) ? 'single' : mode;

    const result = resolveSelect(
        targetId ?? state.focusedItemId ?? undefined,
        state.selection,
        state.selectionAnchor,
        state.items,
        config.select,
        resolveMode as any
    );

    if (result.changed) {
        commitAll(store, {
            selection: result.selection,
            anchor: result.anchor,
        });
    }
}

function handleActivate(payload: unknown) {
    const entry = GlobalZoneRegistry.getActiveZoneEntry();
    if (!entry || !entry.config) return;

    const { store, config, onActivate } = entry;
    const state = store.getState();
    const { targetId } = (payload as OSActivatePayload) || {};

    const idToActivate = targetId ?? state.focusedItemId;

    const result = resolveActivate(
        idToActivate,
        'enter',
        config.activate
    );

    if (result.shouldActivate && result.targetId) {
        onActivate?.(result.targetId);

        commitAll(store, {
            selection: [result.targetId],
            anchor: result.targetId,
        });
    }
}

/**
 * handleFocus - Pipeline Phase 3 (Resolve) entry point for FOCUS intent
 */
function handleFocus(payload: unknown) {
    const { id, zoneId } = payload as { id: string, zoneId: string };
    if (!id || !zoneId) return;

    const entry = GlobalZoneRegistry.getZoneEntry(zoneId);
    if (!entry || !entry.config) return;

    const { store } = entry;
    const config = entry.config;
    const state = store.getState();

    // 1. Resolve: Check if change is needed
    if (state.focusedItemId === id) {
        // Even if same item, ensure zone is active
        GlobalZoneRegistry.setActiveZone(zoneId);
        return;
    }

    // 2. Commit: Update store
    commitAll(store, { targetId: id });

    // 3. Selection: Follow-focus if configured
    if (config.select.followFocus && config.select.mode !== 'none') {
        commitAll(store, {
            selection: [id],
            anchor: id,
        });
    }

    // 4. Orchestration: Set as active zone
    GlobalZoneRegistry.setActiveZone(zoneId);
}

function handleDismiss() {
    const entry = GlobalZoneRegistry.getActiveZoneEntry();
    if (!entry || !entry.config) return;

    const { store } = entry;
    const config = entry.config;
    const state = store.getState();

    if (config.dismiss.escape === 'close') {
        commitAll(store, { targetId: null });
    } else if (config.dismiss.escape === 'deselect') {
        if (state.selection.length > 0) {
            commitAll(store, { selection: [], anchor: null });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export function FocusCommandHandler() {
    useCommandListener([
        { command: OS_COMMANDS.NAVIGATE, handler: handleNavigate },
        { command: OS_COMMANDS.TAB, handler: () => handleTab('forward') },
        { command: OS_COMMANDS.TAB_PREV, handler: () => handleTab('backward') },
        { command: OS_COMMANDS.SELECT, handler: handleSelect },
        { command: OS_COMMANDS.ACTIVATE, handler: handleActivate },
        { command: OS_COMMANDS.FOCUS, handler: handleFocus },
        { command: OS_COMMANDS.DISMISS, handler: handleDismiss },
    ]);

    return null;
}
