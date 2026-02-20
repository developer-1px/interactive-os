/**
 * OS_CHECK command — Unit Tests
 *
 * Tests: CHECK → onCheck callback pipeline via ZoneRegistry.
 */

import { OS_CHECK } from "@os/3-commands/interaction/check";
import { os } from "@os/kernel";
import { describe, it } from "vitest";
import {
  registerZone,
  setupFocus,
  useKernelSnapshot,
} from "./helpers/os-command-helpers";

useKernelSnapshot();

describe("CHECK → onCheck pipeline", () => {
  it("dispatches onCheck callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onCheck: (cursor) => ({
        type: "mock/toggle",
        payload: { id: cursor.focusId },
      }),
    });

    os.dispatch(OS_CHECK({ targetId: "item-1" }));
  });

  it("does nothing when Zone has no onCheck", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    os.dispatch(OS_CHECK({ targetId: "item-1" }));
  });
});
