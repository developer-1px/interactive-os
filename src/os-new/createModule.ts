/**
 * createModule — App Framework Layer
 *
 * Wraps registerAppSlice to provide:
 * 1. Unified module definition (state + commands + selectors in one place)
 * 2. Module.create() for test isolation (fresh kernel per test)
 * 3. Production compatibility (singleton kernel, useComputed)
 *
 * @example
 *   const TodoModule = createModule("todo", INITIAL_STATE, (define) => ({
 *     addTodo: define.command("ADD_TODO", handler),
 *     selectors: { visibleTodos: selectVisibleTodos },
 *   }));
 *
 *   // Test:
 *   const app = TodoModule.create();
 *   app.dispatch.addTodo({ text: "Buy milk" });
 *   expect(app.state.todos).toHaveLength(1);
 *
 *   // Production:
 *   const todos = TodoModule.useComputed(s => s.data.todos);
 */

import { createKernel, defineScope } from "@kernel";
import type { CommandFactory } from "@kernel/core/tokens";
import { registerAppSlice } from "./appSlice";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

type HandlerReturn<S> = { state: S; dispatch?: any } | undefined;

type CommandHandler<S, P> = (ctx: { state: S }) => (payload: P) => HandlerReturn<S>;

interface ModuleDefine<S> {
    command<P = void>(
        type: string,
        deps: any[],
        handler: CommandHandler<S, P>,
    ): CommandFactory<string, P>;
}

type SelectorMap<S> = Record<string, (state: S, ...args: any[]) => any>;

interface ModuleConfig<S, C extends Record<string, CommandFactory<any, any>>, Sel extends SelectorMap<S>> {
    commands: C;
    selectors?: Sel;
}

// ═══════════════════════════════════════════════════════════════════
// Module Instance (for testing)
// ═══════════════════════════════════════════════════════════════════

interface ModuleInstance<S, C extends Record<string, CommandFactory<any, any>>, Sel extends SelectorMap<S>> {
    /** Current state (getter) */
    readonly state: S;
    /** Dispatch commands by name */
    dispatch: { [K in keyof C]: (payload?: any) => void };
    /** Selectors bound to current state */
    select: { [K in keyof Sel]: (...args: any[]) => ReturnType<Sel[K]> };
    /** Reset to initial state */
    reset(): void;
}

// ═══════════════════════════════════════════════════════════════════
// Module (returned by createModule)
// ═══════════════════════════════════════════════════════════════════

interface Module<S, C extends Record<string, CommandFactory<any, any>>, Sel extends SelectorMap<S>> {
    /** Create an isolated test instance (fresh kernel) */
    create(overrides?: Partial<S>): ModuleInstance<S, C, Sel>;

    /** Production: useComputed hook via singleton kernel */
    useComputed<T>(selector: (s: S) => T): T;

    /** Production: read current state from singleton kernel */
    getState(): S;

    /** Production: command factories for direct dispatch */
    commands: C;
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function createModule<
    S,
    C extends Record<string, CommandFactory<any, any>>,
    Sel extends SelectorMap<S> = Record<string, never>,
>(
    appId: string,
    initialState: S,
    factory: (define: ModuleDefine<S>) => { commands: C; selectors?: Sel },
    options?: { history?: boolean; persistence?: { key: string; debounceMs?: number } },
): Module<S, C, Sel> {

    // ── Production: register on singleton kernel ──
    const slice = registerAppSlice<S>(appId, {
        initialState,
        history: options?.history,
        persistence: options?.persistence,
    });

    // Build define API by delegating to slice.group
    const prodDefine: ModuleDefine<S> = {
        command(type, deps, handler) {
            return slice.group.defineCommand(type, deps, handler as any);
        },
    };

    // Run factory to get command definitions + selectors
    const prodConfig = factory(prodDefine);

    // ── Module API ──
    const module: Module<S, C, Sel> = {
        commands: prodConfig.commands,

        useComputed<T>(selector: (s: S) => T): T {
            return slice.useComputed(selector);
        },

        getState(): S {
            return slice.getState();
        },

        create(overrides?: Partial<S>): ModuleInstance<S, C, Sel> {
            return createTestInstance<S, C, Sel>(
                appId,
                overrides ? { ...initialState, ...overrides } : initialState,
                factory,
                prodConfig.selectors,
            );
        },
    };

    return module;
}

// ═══════════════════════════════════════════════════════════════════
// Test Instance Factory
// ═══════════════════════════════════════════════════════════════════

function createTestInstance<
    S,
    C extends Record<string, CommandFactory<any, any>>,
    Sel extends SelectorMap<S>,
>(
    appId: string,
    initialState: S,
    factory: (define: ModuleDefine<S>) => { commands: C; selectors?: Sel },
    selectors?: Sel,
): ModuleInstance<S, C, Sel> {

    // Fresh kernel — fully isolated from production
    interface TestAppState {
        os: Record<string, never>;
        apps: Record<string, unknown>;
    }

    const testKernel = createKernel<TestAppState>({
        os: {},
        apps: { [appId]: initialState },
    });

    // Create scoped group on the test kernel
    const scope = defineScope(appId);
    const group = testKernel.group({
        scope,
        stateSlice: {
            get: (full: TestAppState) => full.apps[appId] as S,
            set: (full: TestAppState, slice: unknown) => ({
                ...full,
                apps: { ...full.apps, [appId]: slice },
            }),
        },
    });

    // Build define API for test kernel
    const testDefine: ModuleDefine<S> = {
        command(type, deps, handler) {
            return group.defineCommand(type, deps, handler as any);
        },
    };

    // Run factory to register commands on test kernel
    const testConfig = factory(testDefine);

    // Build dispatch proxy
    const dispatch = {} as { [K in keyof C]: (payload?: any) => void };
    for (const [name, cmdFactory] of Object.entries(testConfig.commands)) {
        (dispatch as any)[name] = (payload?: any) => {
            testKernel.dispatch((cmdFactory as any)(payload ?? {}));
        };
    }

    // Build selector proxy
    const select = {} as { [K in keyof Sel]: (...args: any[]) => ReturnType<Sel[K]> };
    if (selectors) {
        for (const [name, selectorFn] of Object.entries(selectors)) {
            (select as any)[name] = (...args: any[]) => {
                const appState = testKernel.getState().apps[appId] as S;
                return selectorFn(appState, ...args);
            };
        }
    }

    return {
        get state() {
            return testKernel.getState().apps[appId] as S;
        },

        dispatch,
        select,

        reset() {
            testKernel.setState(() => ({
                os: {},
                apps: { [appId]: initialState },
            }));
        },
    };
}
