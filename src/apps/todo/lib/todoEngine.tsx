import { createCommandStore } from "@os/core/command/store";
import { useCommandCenter } from "@os/core/command/useCommandCenter";
import { useContextService } from "@os/core/context";
import { useFocusStore } from "@os/core/focus";

import { UNIFIED_TODO_REGISTRY } from "@apps/todo/features/commands/index";
import type { AppState, TodoCommand } from "@apps/todo/model/types";
import { TODO_KEYMAP } from "@apps/todo/features/todoKeys";
import { useMemo, useLayoutEffect } from "react";
import { createOSRegistry } from "@os/core/command/osRegistry";

// Imported domain logic
import { loadState } from "@apps/todo/features/todo_details/persistence";
// import {
//   listStrategy,
//   boardStrategy,
//   sidebarStrategy,
// } from "./todo/focusStrategies";
import { navigationMiddleware } from "@apps/todo/features/todo_details/navigationMiddleware";
import { mapStateToContext } from "@apps/todo/bridge/contextMapper";

// Initialize Unified Engine Registry (The "Brain" knows all, but UI is scoped)
const ENGINE_REGISTRY = UNIFIED_TODO_REGISTRY;
// Register OS Standard Commands
createOSRegistry<AppState>().forEach(cmd => ENGINE_REGISTRY.register(cmd as any));
ENGINE_REGISTRY.setKeymap(TODO_KEYMAP);

// Register Strategies (Now fully generic!)
// focusRegistry.register("listView", listStrategy);
// focusRegistry.register("boardView", boardStrategy);
// focusRegistry.register("sidebar", sidebarStrategy);

/**
 * useTodoStore: Global Zustand store for Todo application state.
 */
export const useTodoStore = createCommandStore<AppState, TodoCommand>(
  ENGINE_REGISTRY,
  loadState(),
  {
    onStateChange: navigationMiddleware,
    // getEnv removed (Pure Payload Architecture)
    onDispatch: (action: TodoCommand) => {
      // "Smart Dispatch" - now purely handled by Context Receiver in commands
      return action;
    },
  },
);

/**
 * useTodoEngine:
 * Returns everything the View needs, pre-bound to the global store.
 */
export function useTodoEngine() {
  // OS-Level Focus Subscription
  const activeZoneId = useFocusStore((s) => s.activeZoneId); // Subscribe to Zone too
  const focusPath = useFocusStore((s) => s.focusPath);

  // Memoize config to depend on OS Focus
  const config = useMemo(
    () => ({
      mapStateToContext: (state: AppState) =>
        mapStateToContext(state, activeZoneId, focusPath),
    }),
    [activeZoneId, focusPath],
  );

  const engine = useCommandCenter<AppState, TodoCommand>(
    useTodoStore,
    ENGINE_REGISTRY,
    config,
  );

  // Patch state into providerValue for Headless Focus Strategies
  // (Memoized: only re-emits when core identity changes)
  const providerValueWithState = useMemo(
    () => ({
      ...engine.providerValue,
      state: engine.state,
    }),
    [engine.providerValue, engine.state],
  );

  const contextService = useContextService();

  useLayoutEffect(() => {
    if (contextService) {
      contextService.updateContext({ activeZone: activeZoneId || undefined });
    }
  }, [activeZoneId, contextService]);

  // Return the FULL provider value to be consumed by App.tsx
  return providerValueWithState;
}
