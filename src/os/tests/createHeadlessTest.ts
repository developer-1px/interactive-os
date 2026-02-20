import { resetAllAppSlices } from "@os/appSlice";
import type { AppState } from "@os/kernel";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { produce } from "immer";

/**
 * createHeadlessTest
 *
 * Provides a clean global kernel environment for integration testing.
 * Uses the SINGLETON kernel (mimicking production) but resets state between tests.
 * This ensures all OS commands (FOCUS, NAVIGATE) are registered and working.
 *
 * Usage:
 *   const { dispatch, getState } = createHeadlessTest();
 *   dispatch(MY_COMMAND());
 */
export function createHeadlessTest() {
  // 1. Reset everything (Apps + OS)
  resetAllAppSlices();

  // 2. Helper to reset specific zones
  function resetZone(
    zoneId: string,
    overrides: Partial<AppState["os"]["focus"]["zones"][string]> = {},
  ) {
    kernel.setState(
      produce((state: AppState) => {
        state.os.focus.zones[zoneId] = {
          ...initialZoneState,
          ...overrides,
        };
      }),
    );
  }

  // 3. Return interfaces
  return {
    kernel,
    dispatch: kernel.dispatch,
    get state() {
      return kernel.getState() as AppState;
    },
    get os() {
      return (kernel.getState() as any).os as AppState["os"];
    },
    resetZone,
  };
}
