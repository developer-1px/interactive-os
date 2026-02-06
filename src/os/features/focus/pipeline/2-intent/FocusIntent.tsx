/**
 * FocusIntent - OS Focus Command Handler
 * 
 * Single source of truth for handling all focus-related OS commands.
 * 
 * Architecture: Pure Function + Commit Separation
 * - resolve*() = Intent Layer (pure functions returning StateChange)
 * - handle*() = Orchestration Layer (context lookup + intent + effect)
 * - applyChange() = Effect Helper (commit, telemetry, dispatch)
 */

import { useCommandListener } from '../../../command/hooks/useCommandListener';
import { OS_COMMANDS, type OSNavigatePayload, type OSSelectPayload, type OSActivatePayload } from '../../../command/definitions/commandsShell';
import { FocusRegistry, type GroupEntry } from '../../registry/FocusRegistry';
import { updateNavigate } from '../3-update/updateNavigate';
import { updateTab } from '../3-update/updateTab';
import { updateSelect } from '../3-update/updateSelect';
import { updateActivate } from '../3-update/updateActivate';
import { updateExpand } from '../3-update/updateExpand';
import { updateZoneTraverse } from '../3-update/updateZoneTraverse';
import { updateZoneSpatial } from '../3-update/updateZoneSpatial';
import { DOMRegistry } from '../../registry/DOMRegistry';
import { applyChange, type StateChange } from '../6-effect/focusEffects';
import { logger } from '@os/app/debug/logger';
import type { FocusGroupStore } from '../../store/focusGroupStore';
import type { FocusGroupConfig } from '../../types';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface FocusContext {
    entry: GroupEntry;
    store: FocusGroupStore;
    config: FocusGroupConfig;
    state: ReturnType<FocusGroupStore['getState']>;
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function getActiveContext(): FocusContext | null {
    const entry = FocusRegistry.getActiveGroupEntry();
    if (!entry?.config) return null;
    return {
        entry,
        store: entry.store,
        config: entry.config,
        state: entry.store.getState(),
    };
}

function getContextForZone(zoneId: string): FocusContext | null {
    const entry = FocusRegistry.getGroupEntry(zoneId);
    if (!entry?.config) return null;
    return {
        entry,
        store: entry.store,
        config: entry.config,
        state: entry.store.getState(),
    };
}

function withFollowFocus(
    change: StateChange,
    targetId: string | null | undefined,
    config: FocusGroupConfig,
    entry: GroupEntry
): StateChange {
    if (!config.select.followFocus || !targetId) return change;

    return {
        ...change,
        selection: [targetId],
        anchor: targetId,
        telemetry: { command: OS_COMMANDS.SELECT, payload: { targetId, mode: 'followFocus' } },
        bindCommand: entry.bindSelectCommand
            ? { type: entry.bindSelectCommand.type, payload: { ...entry.bindSelectCommand.payload, id: targetId } }
            : undefined,
    };
}

// ═══════════════════════════════════════════════════════════════════
// Pure Resolvers
// ═══════════════════════════════════════════════════════════════════

function resolveNavigate(ctx: FocusContext, payload: OSNavigatePayload): StateChange | null {
    const dir = payload.direction.toLowerCase() as 'up' | 'down' | 'left' | 'right';
    const activeId = ctx.state.focusedItemId;

    // Tree Expansion/Collapse
    if (activeId && (dir === 'left' || dir === 'right')) {
        const item = DOMRegistry.getItem(activeId);
        const role = item?.getAttribute('role');
        const isExpandable = role === 'treeitem' || role === 'button';

        if (isExpandable) {
            const isExpanded = ctx.state.expandedItems.includes(activeId);
            if (dir === 'right' && !isExpanded) {
                const res = updateExpand(ctx.store, activeId, 'expand');
                if (res.changed) return null; // Handled by expand
            }
            if (dir === 'left' && isExpanded) {
                const res = updateExpand(ctx.store, activeId, 'collapse');
                if (res.changed) return null; // Handled by collapse
            }
        }
    }

    // Use live DOM order (source of truth)
    const liveItems = DOMRegistry.getGroupItems(ctx.state.groupId);

    const result = updateNavigate(
        ctx.state.focusedItemId,
        dir,
        liveItems,
        ctx.config.navigate,
        { stickyX: ctx.state.stickyX, stickyY: ctx.state.stickyY }
    );

    // Seamless navigation
    if (ctx.config.navigate.seamless && result.targetId === ctx.state.focusedItemId) {
        const spatialResult = updateZoneSpatial(
            ctx.state.groupId, dir, ctx.state.focusedItemId,
            {
                getItemRect: (id) => DOMRegistry.getItem(id)?.getBoundingClientRect(),
                getGroupRect: (id) => DOMRegistry.getGroupRect(id),
                getAllGroupRects: () => DOMRegistry.getAllGroupRects(),
                getGroupEntry: (id) => FocusRegistry.getGroupEntry(id),
            }
        );

        if (spatialResult) {
            return {
                targetId: spatialResult.targetItemId,
                store: spatialResult.targetStore,
                activeGroupId: spatialResult.targetGroupId,
            };
        }
    }

    const change: StateChange = {
        targetId: result.targetId,
        stickyX: result.stickyX,
        stickyY: result.stickyY,
    };

    return withFollowFocus(change, result.targetId, ctx.config, ctx.entry);
}

function resolveTab(ctx: FocusContext, direction: 'forward' | 'backward'): StateChange | null {
    // Use live DOM order (source of truth)
    const liveItems = DOMRegistry.getGroupItems(ctx.state.groupId);

    const result = updateTab(
        ctx.state.focusedItemId,
        direction,
        liveItems,
        ctx.config.tab
    );

    if (result.action === 'trap' && result.targetId) {
        return { targetId: result.targetId };
    }

    if ((result.action === 'flow' && !result.targetId) || result.action === 'escape') {
        const traverseResult = updateZoneTraverse(direction, ctx.config, {
            getSiblingGroupId: (dir) => FocusRegistry.getSiblingGroup(dir),
            getGroupEntry: (id) => FocusRegistry.getGroupEntry(id),
        });

        if (traverseResult) {
            const targetEntry = FocusRegistry.getGroupEntry(traverseResult.targetGroupId);
            let change: StateChange = {
                targetId: traverseResult.targetItemId,
                store: traverseResult.targetStore,
                activeGroupId: traverseResult.targetGroupId,
            };

            if (targetEntry?.config) {
                change = withFollowFocus(change, traverseResult.targetItemId, targetEntry.config, targetEntry);
            }
            return change;
        }
        return null;
    }

    if (result.action === 'flow' && result.targetId) {
        return { targetId: result.targetId };
    }

    return null;
}

function resolveSelect(ctx: FocusContext, payload: OSSelectPayload): StateChange | null {
    const { mode, targetId } = payload;
    const resolvedTargetId = targetId ?? ctx.state.focusedItemId ?? undefined;
    const resolveMode = (mode === 'replace' || !mode) ? 'single' : mode;

    // Use live DOM order (source of truth)
    const liveItems = DOMRegistry.getGroupItems(ctx.state.groupId);

    const result = updateSelect(
        resolvedTargetId,
        ctx.state.selection,
        ctx.state.selectionAnchor,
        liveItems,
        ctx.config.select,
        resolveMode as any
    );

    const change: StateChange = {};

    if (result.changed) {
        change.selection = result.selection;
        change.anchor = result.anchor;
    }

    if (ctx.entry.bindSelectCommand && resolvedTargetId) {
        change.bindCommand = {
            type: ctx.entry.bindSelectCommand.type,
            payload: { ...ctx.entry.bindSelectCommand.payload, id: resolvedTargetId },
        };
    }

    return Object.keys(change).length > 0 ? change : null;
}

function resolveActivate(ctx: FocusContext, payload: OSActivatePayload): StateChange | null {
    const { targetId } = payload || {};
    const idToActivate = targetId ?? ctx.state.focusedItemId;

    const result = updateActivate(idToActivate, 'enter', ctx.config.activate);

    if (!result.shouldActivate || !result.targetId) return null;

    const change: StateChange = {
        selection: [result.targetId],
        anchor: result.targetId,
    };

    if (ctx.entry.bindActivateCommand) {
        change.bindCommand = {
            type: ctx.entry.bindActivateCommand.type,
            payload: { ...ctx.entry.bindActivateCommand.payload, id: result.targetId },
        };
    }

    return change;
}

function resolveFocus(ctx: FocusContext, id: string, zoneId: string): StateChange | null {
    if (ctx.state.focusedItemId === id) {
        return { activeGroupId: zoneId };
    }

    const change: StateChange = {
        targetId: id,
        activeGroupId: zoneId,
    };

    if (ctx.config.select.followFocus && ctx.config.select.mode !== 'none') {
        change.selection = [id];
        change.anchor = id;
    }

    return change;
}

function resolveDismiss(ctx: FocusContext): StateChange | null {
    if (ctx.config.dismiss.escape === 'close') {
        return { targetId: null };
    }
    if (ctx.config.dismiss.escape === 'deselect' && ctx.state.selection.length > 0) {
        return { selection: [], anchor: null };
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════
// Command Handlers (Orchestration Layer)
// ═══════════════════════════════════════════════════════════════════

function handleNavigate(payload: unknown) {
    logger.time('P2:Navigate');
    const ctx = getActiveContext();
    if (!ctx) return logger.timeEnd('FOCUS', 'P2:Navigate');

    const change = resolveNavigate(ctx, payload as OSNavigatePayload);
    if (change) applyChange(change, ctx.store);

    logger.timeEnd('FOCUS', 'P2:Navigate');
}

function handleTab(direction: 'forward' | 'backward') {
    const ctx = getActiveContext();

    // Cold Start
    if (!ctx) {
        if (direction === 'forward') {
            const orderedIds = FocusRegistry.getOrderedGroups();
            if (orderedIds.length > 0) {
                FocusRegistry.setActiveGroup(orderedIds[0]);
            }
        }
        return;
    }

    const change = resolveTab(ctx, direction);
    if (change) applyChange(change, ctx.store);
}

function handleSelect(payload: unknown) {
    const ctx = getActiveContext();
    if (!ctx) return;

    const change = resolveSelect(ctx, payload as OSSelectPayload);
    if (change) applyChange(change, ctx.store);
}

function handleActivate(payload: unknown) {
    const ctx = getActiveContext();
    if (!ctx) return;

    const change = resolveActivate(ctx, payload as OSActivatePayload);
    if (change) applyChange(change, ctx.store);
}

function handleFocus(payload: unknown) {
    logger.time('P2:Focus');
    const { id, zoneId } = payload as { id: string; zoneId: string };
    if (!id || !zoneId) return logger.timeEnd('FOCUS', 'P2:Focus');

    const ctx = getContextForZone(zoneId);
    if (!ctx) return logger.timeEnd('FOCUS', 'P2:Focus');

    const change = resolveFocus(ctx, id, zoneId);
    if (change) applyChange(change, ctx.store);

    logger.timeEnd('FOCUS', 'P2:Focus');
}

function handleDismiss() {
    const ctx = getActiveContext();
    if (!ctx) return;

    const change = resolveDismiss(ctx);
    if (change) applyChange(change, ctx.store);
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export function FocusIntent() {
    useCommandListener([
        { command: OS_COMMANDS.NAVIGATE, handler: ({ payload }) => handleNavigate(payload) },
        { command: OS_COMMANDS.TAB, handler: () => handleTab('forward') },
        { command: OS_COMMANDS.TAB_PREV, handler: () => handleTab('backward') },
        { command: OS_COMMANDS.SELECT, handler: ({ payload }) => handleSelect(payload) },
        { command: OS_COMMANDS.ACTIVATE, handler: ({ payload }) => handleActivate(payload) },
        { command: OS_COMMANDS.FOCUS, handler: ({ payload }) => handleFocus(payload) },
        { command: OS_COMMANDS.DISMISS, handler: () => handleDismiss() },
    ]);

    return null;
}
