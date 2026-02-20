/**
 * SELECT command — Unit Tests
 *
 * Tests: SELECT (toggle mode) — pure selection via kernel dispatch.
 * Note: This tests the high-level SELECT command from select.ts,
 * NOT the low-level SELECTION_* commands (tested in selection.test.ts).
 */

import { SELECT } from "@os/3-commands/selection/select";
import { kernel } from "@os/kernel";
import { describe, expect, it } from "vitest";
import {
  registerZone,
  setupFocus,
  useKernelSnapshot,
} from "./helpers/os-command-helpers";

useKernelSnapshot();

describe("SELECT — pure selection (no onCheck delegation)", () => {
  it("does NOT dispatch onCheck on SELECT", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onCheck: (cursor) => ({
        type: "mock/toggle",
        payload: { id: cursor.focusId },
      }),
    });

    kernel.dispatch(SELECT({ mode: "toggle" }));

    const zone = kernel.getState().os.focus.zones["testZone"];
    expect(zone?.selection).toContain("item-1");
  });

  it("toggles selection when no callbacks registered", () => {
    setupFocus("plainZone", "item-1");
    registerZone("plainZone", {});

    kernel.dispatch(SELECT({ mode: "toggle" }));

    const zone = kernel.getState().os.focus.zones["plainZone"];
    expect(zone?.selection).toContain("item-1");
  });
});
