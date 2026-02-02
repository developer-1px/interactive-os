import { createCommandStore } from "@os/core/command/store";
import { useCommandCenter } from "@os/core/command/useCommandCenter";
import { useContextService } from "@os/core/context";
import { useFocusStore } from "@os/core/focus";

import { UNIFIED_TODO_REGISTRY } from "@apps/todo/features/commands/index";
import type { AppState, TodoCommand, OSEnvironment } from "@apps/todo/model/types";
import { TODO_KEYMAP } from "@apps/todo/features/todoKeys";
import { setGlobalEngine } from "@os/core/command/CommandContext";
import { useMemo, useLayoutEffect } from "react";

// Imported domain logic
import { loadState } from "@apps/todo/features/todo_details/persistence";
// import {
//   listStrategy,
//   boardStrategy,
//   sidebarStrategy,
// } from "./todo/focusStrategies";
import { navigationMiddleware } from "@apps/todo/features/todo_details/navigationMiddleware";
import { mapStateToContext } from "@apps/todo/features/todo_details/contextMapper";

// Initialize Unified Engine Registry (The "Brain" knows all, but UI is scoped)
const ENGINE_REGISTRY = UNIFIED_TODO_REGISTRY;
ENGINE_REGISTRY.setKeymap(TODO_KEYMAP);

// Register Strategies (Now fully generic!)
// focusRegistry.register("listView", listStrategy);
// focusRegistry.register("boardView", boardStrategy);
// focusRegistry.register("sidebar", sidebarStrategy);

/**
 * useTodoStore: Global Zustand store for Todo application state.
 */
export const useTodoStore = createCommandStore<AppState, TodoCommand, OSEnvironment>(
  ENGINE_REGISTRY,
  loadState(),
  {
    onStateChange: navigationMiddleware,
    getEnv: (): OSEnvironment => {
      // OS-Level Environment Injection
      const { focusedItemId, activeZoneId } = useFocusStore.getState();
      return {
        focusId: focusedItemId,
        activeZone: activeZoneId,
      };
    },
    onDispatch: (action: TodoCommand) => {
      // "Smart Dispatch" - now purely handled by Context Receiver in commands
      return action;
    }
  },
);

/**
 * useTodoEngine:
 * Returns everything the View needs, pre-bound to the global store.
 */
export function useTodoEngine() {
  // OS-Level Focus Subscription
  const focusedItemId = useFocusStore((s) => s.focusedItemId);
  const activeZoneId = useFocusStore((s) => s.activeZoneId); // Subscribe to Zone too

  // Memoize config to depend on OS Focus
  const config = useMemo(
    () => ({
      mapStateToContext: (state: AppState) =>
        mapStateToContext(state, focusedItemId, activeZoneId),
    }),
    [focusedItemId, activeZoneId],
  );

  const engine = useCommandCenter<AppState, TodoCommand>(
    useTodoStore,
    ENGINE_REGISTRY,
    config,
  );

  // Patch state into providerValue for Headless Focus Strategies
  const providerValueWithState = useMemo(
    () => ({
      ...engine.providerValue,
      state: engine.state,
    }),
    [engine.providerValue, engine.state],
  );

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
