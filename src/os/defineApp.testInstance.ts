/**
 * defineApp — TestInstance factory
 *
 * Creates an isolated test kernel with all registered commands re-registered.
 * Pure function — all dependencies passed as parameters.
 */

import { createKernel, defineScope } from "@kernel";
import type { BaseCommand } from "@kernel/core/tokens";
import {
  type Condition,
  type FlatHandler,
  type Selector,
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
  const { appId, initialState, flatHandlerRegistry } = config;

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

  // Re-register all commands on test kernel
  for (const [type, entry] of flatHandlerRegistry) {
    const kernelHandler = (ctx: { readonly state: S }) => (payload: any) =>
      entry.handler(ctx, payload);

    const whenGuard = entry.when
      ? { when: (state: S) => entry.when!.evaluate(state) }
      : undefined;

    testGroup.defineCommand(
      type,
      kernelHandler,
      whenGuard,
    );
  }

  return {
    get state() {
      return testKernel.getState().apps[appId] as S;
    },

    dispatch(command: BaseCommand): boolean {
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

    select<T>(selectorBranded: Selector<S, T>): T {
      const currentState = testKernel.getState().apps[appId] as S;
      return selectorBranded.select(currentState);
    },

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
  };
}

