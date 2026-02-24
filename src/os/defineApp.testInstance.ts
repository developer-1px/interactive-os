/**
 * defineApp — TestInstance factory
 *
 * Creates an isolated test kernel with all registered commands re-registered.
 * Pure function — all dependencies passed as parameters.
 */

import { createKernel, defineScope } from "@kernel";
import type { BaseCommand } from "@kernel/core/tokens";
import { type AppState, initialAppState } from "@os/kernel";
import { focusHandler } from "./3-commands/focus/focus";
import { toastShowHandler } from "./3-commands/toast/toast";
import type {
  Condition,
  FlatHandler,
  Selector,
  TestInstance,
} from "./defineApp.types";
import {
  beginTransaction,
  createHistoryMiddleware,
  endTransaction,
} from "./middlewares/historyKernelMiddleware";
import type { AppModule } from "./modules/types";

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
  /** App modules to install on test kernel */
  modules?: AppModule[];
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
  overrides?: Partial<S> | { history?: boolean; withOS?: boolean },
): TestInstance<S> {
  const { appId, initialState, flatHandlerRegistry } = config;

  // Separate test options from state overrides
  const rawOverrides = overrides ?? {};
  const enableHistory =
    "history" in rawOverrides && rawOverrides.history === true;
  const enableOS = "withOS" in rawOverrides && rawOverrides.withOS === true;

  const stateOverrides =
    enableHistory || enableOS
      ? (({ history: _h, withOS: _w, ...rest }) => rest)(
          rawOverrides as Record<string, unknown>,
        )
      : rawOverrides;

  const testState =
    Object.keys(stateOverrides).length > 0
      ? { ...initialState, ...(stateOverrides as Partial<S>) }
      : initialState;

  const testKernel = createKernel<AppState | TestAppState>(
    enableOS
      ? {
          ...initialAppState,
          apps: { [appId]: testState },
        }
      : {
          os: {} as Record<string, never>,
          apps: { [appId]: testState },
        },
  );

  const testScope = defineScope(appId);
  const testGroup = testKernel.group({
    scope: testScope,
    stateSlice: {
      get: (full: AppState | TestAppState) => full.apps[appId] as S,
      set: (full: AppState | TestAppState, s: unknown) => ({
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

  // Install app modules on test kernel
  for (const mod of config.modules ?? []) {
    // Skip history module — already handled above
    if (mod.id === "history") continue;
    const mws = mod.install({ appId, scope: testScope });
    const mwArr = Array.isArray(mws) ? mws : [mws];
    for (const mw of mwArr) {
      testKernel.use(mw);
    }
  }

  // Re-register all commands on test kernel
  for (const [type, entry] of flatHandlerRegistry) {
    const kernelHandler = (ctx: { readonly state: S }) => (payload: any) => {
      const result = entry.handler(ctx, payload);
      if (result?.dispatch) {
        // Normalize nested dispatches to the test scope
        if (Array.isArray(result.dispatch)) {
          result.dispatch = result.dispatch.map((cmd) => ({
            ...cmd,
            scope: [testScope],
          }));
        } else {
          result.dispatch = { ...result.dispatch, scope: [testScope] };
        }
      }
      return result;
    };

    const whenGuard = entry.when
      ? { when: (state: S) => entry.when!.evaluate(state) }
      : undefined;

    testGroup.defineCommand(
      type,
      kernelHandler as any,
      whenGuard ? ({ when: whenGuard.when } as any) : undefined,
    );
  }

  // Register OS commands (OS_FOCUS, OS_TOAST_SHOW) on test kernel
  // Required for integration tests that rely on focus/selection persistence
  // and toast notifications from modules
  testKernel.defineCommand("OS_FOCUS", focusHandler as any);
  testKernel.defineCommand("OS_TOAST_SHOW", toastShowHandler as any);

  return {
    get state() {
      return testKernel.getState().apps[appId] as S;
    },

    dispatch(command: BaseCommand): boolean {
      const entry = flatHandlerRegistry.get(command.type);
      if (entry?.when) {
        // Evaluate against APP state
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

    // Expose runtime for integration tests (OS state inspection)
    get runtime() {
      return testKernel;
    },
  };
}
