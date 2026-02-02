import { useCommandCenter, createCommandStore } from './command';
import { useContextService } from './context';
import { useFocusStore } from '../stores/useFocusStore';

import { UNIFIED_TODO_REGISTRY } from './todoCommands';
import type { AppState, TodoCommand } from './types';
import { TODO_KEYMAP } from './todoKeys';
import { setGlobalEngine } from './primitives/CommandContext';
import { useMemo, useLayoutEffect } from 'react';

import { focusRegistry } from './logic/focusStrategies';

// Imported domain logic
import { loadState } from './todo/persistence';
import { listStrategy, boardStrategy, sidebarStrategy } from './todo/focusStrategies';
import { todoPhysicsMiddleware } from './todo/navigationPhysics';
import { mapStateToContext } from './todo/contextMapper';

// Initialize Unified Engine Registry (The "Brain" knows all, but UI is scoped)
const ENGINE_REGISTRY = UNIFIED_TODO_REGISTRY;
ENGINE_REGISTRY.setKeymap(TODO_KEYMAP);

// Register Strategies (Now using imported strategies)
focusRegistry.register('listView', listStrategy);
focusRegistry.register('boardView', boardStrategy);
focusRegistry.register('sidebar', sidebarStrategy);

/**
 * useTodoStore: Global Zustand store for Todo application state.
 */
export const useTodoStore = createCommandStore<AppState, TodoCommand>(
    ENGINE_REGISTRY,
    loadState(),
    {
        onStateChange: todoPhysicsMiddleware
    }
);

/**
 * useTodoEngine: 
 * Returns everything the View needs, pre-bound to the global store.
 */
export function useTodoEngine() {
    // OS-Level Focus Subscription
    const focusedItemId = useFocusStore(s => s.focusedItemId);
    const activeZoneId = useFocusStore(s => s.activeZoneId); // Subscribe to Zone too

    // Memoize config to depend on OS Focus
    const config = useMemo(() => ({
        mapStateToContext: (state: AppState) => mapStateToContext(state, focusedItemId, activeZoneId)
    }), [focusedItemId, activeZoneId]);

    const engine = useCommandCenter<AppState, TodoCommand>(
        useTodoStore,
        ENGINE_REGISTRY,
        config
    );

    // Patch state into providerValue for Headless Focus Strategies
    const providerValueWithState = useMemo(() => ({
        ...engine.providerValue,
        state: engine.state
    }), [engine.providerValue, engine.state]);

    // Wire up global singleton bridge
    setGlobalEngine(() => providerValueWithState);

    const contextService = useContextService();

    useLayoutEffect(() => {
        if (contextService) {
            contextService.updateContext({ activeZone: activeZoneId });
        }
    }, [activeZoneId, contextService]);

    return engine;
}
