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
import { kernel, type AppState } from "@os/kernel";
import { createHistoryMiddleware } from "@/os-new/middleware/historyKernelMiddleware";

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
}

export interface AppSliceHandle<S> {
    /** Kernel scope token for this app */
    scope: ScopeToken;
    /** Scoped kernel group — use to defineCommand, defineEffect, etc. */
    group: ReturnType<typeof kernel.group>;
    /** Context token — inject in commands to read app state */
    AppState: ReturnType<typeof kernel.defineContext>;
    /** Read current app state */
    getState(): S;
    /** Update app state (immutable updater pattern) */
    setState(updater: (prev: S) => S): void;
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
    kernel.setState((prev) => ({
        ...prev,
        apps: { ...prev.apps, [appId]: startState },
    }));

    // 3. Create scoped group with state lens (ownership isolation)
    const appGroup = kernel.group({
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
        () => kernel.getState().apps[appId] as S,
    );

    // 5. Persistence middleware (if configured)
    if (persistence) {
        kernel.use(createPersistenceMiddleware(appId, scope, persistence));
    }

    // 6. History middleware (if configured)
    if (config.history) {
        kernel.use(createHistoryMiddleware(appId, scope));
    }

    return {
        scope,
        group: appGroup,
        AppState: AppStateToken,

        getState() {
            return kernel.getState().apps[appId] as S;
        },

        setState(updater: (prev: S) => S) {
            kernel.setState((prev) => ({
                ...prev,
                apps: {
                    ...prev.apps,
                    [appId]: updater(prev.apps[appId] as S),
                },
            }));
        },

        useComputed<T>(selector: (s: S) => T): T {
            return kernel.useComputed((root: AppState) =>
                selector(root.apps[appId] as S),
            );
        },

        dispose() {
            kernel.setState((prev) => {
                const { [appId]: _, ...rest } = prev.apps;
                return { ...prev, apps: rest };
            });
        },
    };
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
    let lastSaved: unknown = undefined;

    return {
        id: `persistence:${appId}`,
        scope,
        after(ctx) {
            const appState = (ctx.state as AppState).apps[appId];

            // Only persist if app state actually changed
            if (appState === lastSaved) return ctx;
            lastSaved = appState;

            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                try {
                    localStorage.setItem(key, JSON.stringify(appState));
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
