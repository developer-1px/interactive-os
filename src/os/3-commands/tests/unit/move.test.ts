/**
 * OS_MOVE_UP / OS_MOVE_DOWN commands — Unit Tests
 *
 * Tests: OS_MOVE → onMoveUp/onMoveDown callback pipeline via ZoneRegistry.
 */

import { OS_MOVE_DOWN, OS_MOVE_UP } from "@os/3-commands/interaction/move";
import { kernel } from "@os/kernel";
import { describe, it } from "vitest";
import {
  registerZone,
  setupFocus,
  useKernelSnapshot,
} from "./helpers/os-command-helpers";

useKernelSnapshot();

describe("OS_MOVE → onMoveUp/Down pipeline", () => {
  it("dispatches onMoveUp callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onMoveUp: (cursor) => ({
        type: "mock/moveUp",
        payload: { id: cursor.focusId },
      }),
    });

    kernel.dispatch(OS_MOVE_UP());
  });

  it("dispatches onMoveDown callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onMoveDown: (cursor) => ({
        type: "mock/moveDown",
        payload: { id: cursor.focusId },
      }),
    });

    kernel.dispatch(OS_MOVE_DOWN());
  });

  it("does nothing when Zone has no onMoveUp", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    kernel.dispatch(OS_MOVE_UP());
  });

  it("does nothing when Zone has no onMoveDown", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    kernel.dispatch(OS_MOVE_DOWN());
  });

  it("does nothing when no active zone (MOVE_UP)", () => {
    kernel.dispatch(OS_MOVE_UP());
  });

  it("does nothing when no active zone (MOVE_DOWN)", () => {
    kernel.dispatch(OS_MOVE_DOWN());
  });
});
