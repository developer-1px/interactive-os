/**
 * defineApp — TestInstance factory
 *
 * Creates an isolated test kernel with all registered commands re-registered.
 * Pure function — all dependencies passed as parameters.
 */

import { createKernel, defineScope } from "@kernel";
import type { CommandFactory } from "@kernel/core/tokens";
import {
  __selectorBrand,
  type Condition,
  type FlatHandler,
  type TestInstance,
} from "./defineApp.types";
import {
  beginTransaction,
  createHistoryMiddleware,
  endTransaction,
} from "./middlewares/historyKernelMiddleware";

// ═══════════════════════════════════════════════════════════════════
// TestInstance Config (injected by defineApp)
// ═══════════════════════════════════════════════════════════════════

export interface CreateTestConfig<S> {
  appId: string;
  initialState: S;
  flatHandlerRegistry: Map<
    string,
    { handler: FlatHandler<S, any>; when?: Condition<S> }
  >;
  options?: {
    selectors?: Record<string, (state: S, ...args: any[]) => any>;
  };
}

// ═══════════════════════════════════════════════════════════════════
// createTestInstance — Pure function
// ═══════════════════════════════════════════════════════════════════

interface TestAppState {
  os: Record<string, never>;
  apps: Record<string, unknown>;
}

export function createTestInstance<S>(
  config: CreateTestConfig<S>,
  overrides?: Partial<S> | { history?: boolean },
): TestInstance<S> {
  const { appId, initialState, flatHandlerRegistry, options } = config;

  // Separate test options from state overrides
  const rawOverrides = overrides ?? {};
  const enableHistory =
    "history" in rawOverrides && rawOverrides.history === true;
  const stateOverrides = enableHistory
    ? (({ history: _h, ...rest }) => rest)(
        rawOverrides as Record<string, unknown>,
      )
    : rawOverrides;

  const testState =
    Object.keys(stateOverrides).length > 0
      ? { ...initialState, ...(stateOverrides as Partial<S>) }
      : initialState;

  const testKernel = createKernel<TestAppState>({
    os: {} as Record<string, never>,
    apps: { [appId]: testState },
  });

  const testScope = defineScope(appId);
  const testGroup = testKernel.group({
    scope: testScope,
    stateSlice: {
      get: (full: TestAppState) => full.apps[appId] as S,
      set: (full: TestAppState, s: unknown) => ({
        ...full,
        apps: { ...full.apps, [appId]: s },
      }),
    },
  });

  // Register history middleware on test kernel when history is enabled
  if (enableHistory) {
    const historyMw = createHistoryMiddleware(appId, testScope);
    testKernel.use(historyMw);
  }

  // Re-register all commands on test kernel, collecting test factories
  const testFactories = new Map<string, CommandFactory<any, any>>();
  for (const [type, entry] of flatHandlerRegistry) {
    const kernelHandler = (ctx: { state: S }) => (payload: any) =>
      entry.handler(ctx, payload);

    const whenGuard = entry.when
      ? { when: (state: unknown) => entry.when?.evaluate(state as S) }
      : undefined;

    const testFactory = testGroup.defineCommand(
      type,
      kernelHandler as any,
      whenGuard as any,
    );
    testFactories.set(type, testFactory);
  }

  // ── v3 compat: Build dispatch proxy ──
  const dispatchProxy: Record<string, (payload?: any) => void> = {};
  for (const [type] of flatHandlerRegistry) {
    dispatchProxy[type] = (payload?: any) => {
      const factory = testFactories.get(type);
      if (factory) {
        testKernel.dispatch((factory as any)(payload ?? {}));
      }
    };
  }

  // ── v3 compat: Build select proxy ──
  const selectProxy: Record<string, (...args: any[]) => any> = {};
  if (options?.selectors) {
    for (const [name, selectorFn] of Object.entries(options.selectors)) {
      selectProxy[name] = (...args: any[]) => {
        const appState = testKernel.getState().apps[appId] as S;
        return selectorFn(appState, ...args);
      };
    }
  }

  // ── v3 compat: Build commands map with `when` metadata ──
  const commandsMap: Record<string, any> = {};
  for (const [type, entry] of flatHandlerRegistry) {
    const factory = testFactories.get(type);
    if (factory) {
      commandsMap[type] = factory;
      (commandsMap[type] as any).when = entry.when
        ? (state: any) => entry.when?.evaluate(state)
        : null;
    }
  }

  return {
    get state() {
      return testKernel.getState().apps[appId] as S;
    },

    dispatch: Object.assign(
      (command: any): boolean => {
        // v5 style: dispatch(command)
        const entry = flatHandlerRegistry.get(command.type);
        if (entry?.when) {
          const currentState = testKernel.getState().apps[appId] as S;
          if (!entry.when.evaluate(currentState)) return false;
        }
        // Redirect to test scope — zone commands carry production scope
        // (e.g., ['todo-v5:list']) but test kernel uses single test scope
        const normalizedCmd = {
          ...command,
          scope: [testScope],
        };
        testKernel.dispatch(normalizedCmd);
        return true;
      },
      // v3 style: dispatch.addTodo({...})
      dispatchProxy,
    ),

    // Dual: v5 select(brandedSelector) + v3 select.visibleTodos()
    select: Object.assign((selectorOrBranded: any) => {
      // v5 style: select(brandedSelector)
      if (selectorOrBranded && __selectorBrand in selectorOrBranded) {
        const currentState = testKernel.getState().apps[appId] as S;
        return selectorOrBranded.select(currentState);
      }
      return undefined;
    }, selectProxy) as any,

    // v3 style: commands.cancelEdit
    commands: commandsMap,

    reset() {
      testKernel.setState(() => ({
        os: {} as Record<string, never>,
        apps: { [appId]: testState },
      }));
    },

    evaluate(condition: Condition<S>): boolean {
      const currentState = testKernel.getState().apps[appId] as S;
      return condition.evaluate(currentState);
    },

    transaction(fn: () => void): void {
      beginTransaction();
      try {
        fn();
      } finally {
        endTransaction();
      }
    },
  } as any;
}
