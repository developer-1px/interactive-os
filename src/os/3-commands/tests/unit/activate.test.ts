/**
 * OS_ACTIVATE command — Unit Tests
 *
 * Tests: OS_ACTIVATE → onAction callback pipeline via ZoneRegistry.
 */

import { OS_ACTIVATE } from "@os/3-commands/interaction/activate";
import { os } from "@os/kernel";
import { describe, it } from "vitest";
import {
  registerZone,
  setupFocus,
  useKernelSnapshot,
} from "./helpers/os-command-helpers";

useKernelSnapshot();

describe("OS_ACTIVATE → onAction pipeline", () => {
  it("dispatches onAction callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onAction: (cursor) => ({
        type: "mock/action",
        payload: { id: cursor.focusId },
      }),
    });

    os.dispatch(OS_ACTIVATE());
  });
});
