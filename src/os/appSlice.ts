/**
 * registerAppSlice — App State Registration Factory
 *
 * Registers an app's state as a kernel slice at `state.apps[appId]`.
 * Uses existing kernel primitives (group, defineContext, middleware).
 *
 * Features:
 * - Scoped state isolation (each app reads/writes only its own slice)
 * - Optional persistence (localStorage with debounced save)
 * - Optional undo/redo history
 * - React hook for efficient rendering
 *
 * @example
 *   const todoSlice = registerAppSlice("todo", {
 *     initialState: INITIAL_STATE,
 *     persistence: { key: "todo-app-v5", debounceMs: 250 },
 *   });
 *
 *   // In commands:
 *   const ADD = todoSlice.group.defineCommand("TODO_ADD",
 *     [todoSlice.AppState],
 *     (ctx) => (payload) => ({
 *       state: produce(ctx.state, draft => {
 *         draft.apps.todo = addTodo(ctx.inject(todoSlice.AppState), payload);
 *       })
 *     })
 *   );
 *
 *   // In React:
 *   const todos = todoSlice.useComputed(s => s.data.todos);
 */

import { defineScope } from "@kernel";
import type { Middleware, ScopeToken } from "@kernel/core/tokens";
import { type AppState, initialAppState, os } from "@os/kernel";
import { createHistoryMiddleware } from "@/os/middlewares/historyKernelMiddleware";
import type { AppModule } from "@/os/modules/types";

// ═══════════════════════════════════════════════════════════════════
// Slice Registry (for resetAllAppSlices)
// ═══════════════════════════════════════════════════════════════════

type SliceResetter = () => void;
const sliceResetters = new Map<string, SliceResetter>();

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface AppSliceConfig<S> {
  initialState: S;
  persistence?: {
    key: string;
    debounceMs?: number;
  };
  /** Enable undo/redo history recording. App state must have a `history` field. */
  history?: boolean;
  /** App modules to install */
  modules?: AppModule[];
}

export interface AppSliceHandle<S> {
  /** Kernel scope token for this app */
  scope: ScopeToken;
  /** Scoped kernel group — use to defineCommand, defineEffect, etc. */
  group: ReturnType<typeof os.group>;
  /** Context token — inject in commands to read app state */
  AppState: ReturnType<typeof os.defineContext>;
  /** Read current app state */
  getState(): S;
  /** Update app state (immutable updater pattern) */
  setState(updater: (prev: S) => S): void;
  /** Reset app state to initialState (for test isolation) */
  resetState(): void;
  /** React hook — re-renders only when selected slice changes */
  useComputed<T>(selector: (s: S) => T): T;
  /** Cleanup — remove app state from kernel */
  dispose(): void;
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function registerAppSlice<S>(
  appId: string,
  config: AppSliceConfig<S>,
): AppSliceHandle<S> {
  const scope = defineScope(appId);
  const { initialState, persistence } = config;

  // 1. Hydrate from persistence (if available)
  const startState = persistence
    ? hydrateState(initialState, persistence.key)
    : initialState;

  // 2. Initialize state in kernel tree
  os.setState((prev) => ({
    ...prev,
    apps: { ...prev.apps, [appId]: startState },
  }));

  // 3. Create scoped group with state lens (ownership isolation)
  const appGroup = os.group({
    scope,
    stateSlice: {
      get: (full: AppState) => full.apps[appId] as S,
      set: (full: AppState, slice: unknown) => ({
        ...full,
        apps: { ...full.apps, [appId]: slice },
      }),
    },
  });

  // 4. Context token for commands to read app state
  const AppStateToken = appGroup.defineContext(
    `app:${appId}`,
    () => os.getState().apps[appId] as S,
  );

  // 5. Persistence middleware (if configured)
  if (persistence) {
    os.use(createPersistenceMiddleware(appId, scope, persistence));
  }

  // 6. History middleware (if configured)
  if (config.history) {
    os.use(createHistoryMiddleware(appId, scope));
  }

  // 7. App modules (if configured)
  for (const mod of config.modules ?? []) {
    // Skip history module on app scope — already handled above
    if (mod.id === "history") continue;
    const mws = mod.install({ appId, scope });
    const mwArr = Array.isArray(mws) ? mws : [mws];
    for (const mw of mwArr) {
      os.use(mw);
    }
  }

  const handle: AppSliceHandle<S> = {
    scope,
    group: appGroup,
    AppState: AppStateToken,

    getState() {
      return os.getState().apps[appId] as S;
    },

    setState(updater: (prev: S) => S) {
      os.setState((prev) => ({
        ...prev,
        apps: {
          ...prev.apps,
          [appId]: updater(prev.apps[appId] as S),
        },
      }));
    },

    resetState() {
      os.setState((prev) => ({
        ...prev,
        apps: { ...prev.apps, [appId]: initialState },
      }));
    },

    useComputed<T>(selector: (s: S) => T): T {
      return os.useComputed((root: AppState) =>
        selector(root.apps[appId] as S),
      );
    },

    dispose() {
      sliceResetters.delete(appId);
      os.setState((prev) => {
        const { [appId]: _, ...rest } = prev.apps;
        return { ...prev, apps: rest };
      });
    },
  };

  // Register resetter for resetAllAppSlices()
  sliceResetters.set(appId, () => handle.resetState());

  return handle;
}

// ═══════════════════════════════════════════════════════════════════
// Reset All Slices (TestBot state isolation)
// ═══════════════════════════════════════════════════════════════════

/**
 * Reset all registered app slices to their initial states,
 * plus reset OS state. Used by TestBot shim for test isolation.
 */
export function resetAllAppSlices(): void {
  // Reset each app slice to its initialState
  for (const resetter of sliceResetters.values()) {
    resetter();
  }
  // Reset OS state (focus, zones, etc.)
  os.setState((prev) => ({
    ...prev,
    os: initialAppState.os,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Persistence Middleware
// ═══════════════════════════════════════════════════════════════════

function createPersistenceMiddleware(
  appId: string,
  scope: ScopeToken,
  config: { key: string; debounceMs?: number },
): Middleware {
  const { key, debounceMs = 300 } = config;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastSaved: unknown;

  /**
   * Cancel any pending debounced save.
   * Called when external setState() changes the state directly (e.g., test restore).
   */
  function cancelPendingSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
  }

  /**
   * Detect external setState() (not via dispatch) by subscribing.
   * When state changes outside middleware, cancel pending saves
   * to prevent stale closure data from overwriting the restored state.
   */
  os.subscribe(() => {
    const currentAppState = (os.getState() as AppState).apps[appId];
    if (currentAppState !== lastSaved && saveTimeout) {
      // State changed externally — cancel pending stale save
      cancelPendingSave();
      lastSaved = currentAppState;
    }
  });

  return {
    id: `persistence:${appId}`,
    scope,
    after(ctx) {
      const appState = (ctx.state as AppState).apps[appId];

      // Only persist if app state actually changed
      if (appState === lastSaved) return ctx;
      lastSaved = appState;

      cancelPendingSave();
      saveTimeout = setTimeout(() => {
        try {
          // Read fresh state at save time (not closure-captured state)
          const freshState = (os.getState() as AppState).apps[appId];
          localStorage.setItem(key, JSON.stringify(freshState));
          lastSaved = freshState;
        } catch {
          // localStorage full or unavailable
        }
      }, debounceMs);

      return ctx;
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// Hydration Helper
// ═══════════════════════════════════════════════════════════════════

function hydrateState<S>(initialState: S, storageKey: string): S {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return initialState;

    const loaded = JSON.parse(raw);
    if (!loaded || typeof loaded !== "object" || Array.isArray(loaded)) {
      return initialState;
    }

    // Shallow merge with deep merge for data/ui (schema evolution safety)
    const init = initialState as Record<string, unknown>;
    const load = loaded as Record<string, unknown>;

    return {
      ...initialState,
      ...loaded,
      data:
        init["data"] && load["data"]
          ? {
              ...(init["data"] as Record<string, unknown>),
              ...(load["data"] as Record<string, unknown>),
            }
          : load["data"] || init["data"],
      ui:
        init["ui"] && load["ui"]
          ? {
              ...(init["ui"] as Record<string, unknown>),
              ...(load["ui"] as Record<string, unknown>),
            }
          : load["ui"] || init["ui"],
    };
  } catch {
    return initialState;
  }
}
