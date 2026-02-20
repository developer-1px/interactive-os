import type { AppHandle } from "@os/defineApp.types";
import type { AppState } from "@os/kernel";
import { os } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { produce } from "immer";

/**
 * createIntegrationTest — Factory for OS+App integration tests.
 *
 * Creates a FULL kernel environment including OS state (focus, clipboard, etc.)
 * by leveraging the { withOS: true } option in defineApp's test instance factory.
 */
export function createIntegrationTest<S>(
  app: AppHandle<S>,
  initialStateOverride?: Partial<S>,
) {
  // 1. Create a test instance WITH OS support and overrides
  const testInstance = app.create({
    withOS: true,
    ...(initialStateOverride || {}),
  });

  // 2. Extract components (os is the global singleton)

  // 3. Helper to reset specific zones (common in integration)
  function resetZone(
    zoneId: string,
    overrides: Partial<AppState["os"]["focus"]["zones"][string]> = {},
  ) {
    os.setState(
      produce((state: AppState) => {
        state.os.focus.zones[zoneId] = {
          ...initialZoneState,
          ...overrides,
        };
      }),
    );
  }

  // 4. Return testbed
  return {
    runtime: os,
    get state() {
      return testInstance.state;
    },
    get os() {
      return (os.getState() as any).os as AppState["os"];
    },
    resetZone,
    dispatch: testInstance.dispatch, // Use testInstance dispatch to ensure listeners if any
  };
}
