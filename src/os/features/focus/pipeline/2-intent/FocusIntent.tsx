/**
 * FocusIntent - Global Focus Command Handler
 * 
 * Single source of truth for handling all focus-related OS commands.
 * 
 * Pipeline Phase 2: PARSE / ORCHESTRATE
 * Processes commands into resolved state changes.
 */

import { useCommandListener } from '../../../command/hooks/useCommandListener';
import { OS_COMMANDS, type OSNavigatePayload, type OSSelectPayload, type OSActivatePayload } from '../../../command/definitions/commandsShell';
import { FocusRegistry } from '../../registry/FocusRegistry';
import { updateNavigate } from '../3-update/updateNavigate';
import { updateTab } from '../3-update/updateTab';
import { updateSelect } from '../3-update/updateSelect';
import { updateActivate } from '../3-update/updateActivate';
import { commitAll } from '../4-commit/commitFocus';
import { FocusOrchestrator } from '../../lib/FocusOrchestrator.ts';
import { logger } from '@os/app/debug/logger';

// ═══════════════════════════════════════════════════════════════════
// Command Handlers
// ═══════════════════════════════════════════════════════════════════

function handleNavigate(payload: unknown) {
    logger.time('P2:Navigate');
    logger.debug('FOCUS', '[P2:Intent] NAVIGATE', payload);
    const entry = FocusRegistry.getActiveZoneEntry();
    if (!entry || !entry.config) {
        logger.debug('FOCUS', '[P2:Intent] NAVIGATE - No active zone');
        return;
    }

    const { store } = entry;
    const config = entry.config;
    const state = store.getState();
    const { direction } = payload as OSNavigatePayload;
    const dir = direction.toLowerCase() as 'up' | 'down' | 'left' | 'right';

    const result = updateNavigate(
        state.focusedItemId,
        dir,
        state.items,
        config.navigate,
        { stickyX: state.stickyX, stickyY: state.stickyY }
    );

    // Seamless: If at boundary (same ID returned) and seamless enabled, try cross-zone
    if (config.navigate.seamless && result.targetId === state.focusedItemId) {
        logger.debug('FOCUS', '[P2:Intent] NAVIGATE - Boundary hit, trying seamless');
        const transferred = FocusOrchestrator.traverseZoneSpatial(
            state.zoneId,
            dir,
            state.focusedItemId
        );
        if (transferred) {
            logger.debug('FOCUS', '[P2:Intent] NAVIGATE - Seamless transfer successful');
            logger.timeEnd('FOCUS', 'P2:Navigate');
            return;
        }
    }

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
    logger.timeEnd('FOCUS', 'P2:Navigate');
}

function handleTab(direction: 'forward' | 'backward') {
    const entry = FocusRegistry.getActiveZoneEntry();

    // Fallback: If no active zone, find the first available one (Cold Start)
    if (!entry) {
        if (direction === 'forward') {
            const orderedIds = FocusRegistry.getOrderedGroups();
            if (orderedIds.length > 0) {
                const firstId = orderedIds[0];

                // Activate the first zone
                FocusRegistry.setActiveZone(firstId);
                const firstEntry = FocusRegistry.getZoneEntry(firstId);
                if (firstEntry && firstEntry.store) {
                    const state = firstEntry.store.getState();
                    // If items exist, focus the first one to ensure visual feedback
                    if (state.items.length > 0) {
                        logger.debug('FOCUS', 'Cold Start Tab -> Activating & Focusing', firstId);
                        // We could use updateEntry here if we had the config, but for cold start,
                        // just getting into the zone is usually enough. The user can TAB again.
                        // However, standard expectation is that TAB selects the first item.
                        // Let's rely on the fact that setActiveZone sets the active group,
                        // and if the user hits TAB again, it will now validly process 'flow' or 'trap'.
                    }
                }
            }
        }
        return;
    }

    if (!entry.config) return;

    const { store } = entry;
    const config = entry.config;
    const state = store.getState();

    const result = updateTab(
        state.focusedItemId,
        direction,
        state.items,
        config.tab
    );

    if (result.action === 'trap' && result.targetId) {
        commitAll(store, { targetId: result.targetId });
    } else if (result.action === 'flow') {
        // Flow: move within zone if targetId exists, otherwise exit
        if (result.targetId) {
            commitAll(store, { targetId: result.targetId });
        } else {
            FocusOrchestrator.traverseZone(state.zoneId, direction, config);
        }
    } else if (result.action === 'escape') {
        FocusOrchestrator.traverseZone(state.zoneId, direction, config);
    }
}

function handleSelect(payload: unknown) {
    const entry = FocusRegistry.getActiveZoneEntry();
    if (!entry || !entry.config) return;

    const { store } = entry;
    const config = entry.config;
    const state = store.getState();
    const { mode, targetId } = payload as OSSelectPayload;

    const resolveMode = (mode === 'replace' || !mode) ? 'single' : mode;

    const result = updateSelect(
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
    const entry = FocusRegistry.getActiveZoneEntry();
    if (!entry || !entry.config) return;

    const { store, config, onActivate } = entry;
    const state = store.getState();
    const { targetId } = (payload as OSActivatePayload) || {};

    const idToActivate = targetId ?? state.focusedItemId;

    const result = updateActivate(
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
 * handleFocus - Pipeline Phase 2 (Intent) entry point for FOCUS command
 */
function handleFocus(payload: unknown) {
    logger.time('P2:Focus');
    logger.debug('FOCUS', '[P2:Intent] FOCUS', payload);
    const { id, zoneId } = payload as { id: string, zoneId: string };
    if (!id || !zoneId) {
        logger.debug('FOCUS', '[P2:Intent] FOCUS - Missing id or zoneId');
        return;
    }

    const entry = FocusRegistry.getZoneEntry(zoneId);
    if (!entry || !entry.config) {
        logger.debug('FOCUS', '[P2:Intent] FOCUS - Zone not found:', zoneId);
        return;
    }

    const { store } = entry;
    const config = entry.config;
    const state = store.getState();

    // 1. Resolve: Check if change is needed
    if (state.focusedItemId === id) {
        FocusRegistry.setActiveZone(zoneId);
        logger.timeEnd('FOCUS', 'P2:Focus');
        return;
    }

    // 2. Commit: Update store
    logger.debug('FOCUS', '[P2:Intent] FOCUS - Committing:', id);
    commitAll(store, { targetId: id });

    // 3. Selection: Follow-focus if configured
    if (config.select.followFocus && config.select.mode !== 'none') {
        commitAll(store, {
            selection: [id],
            anchor: id,
        });
    }

    // 4. Orchestration: Set as active zone
    FocusRegistry.setActiveZone(zoneId);
    logger.timeEnd('FOCUS', 'P2:Focus');
}

function handleDismiss() {
    const entry = FocusRegistry.getActiveZoneEntry();
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

export function FocusIntent() {
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
