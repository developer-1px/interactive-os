/**
 * OS_UNDO / OS_REDO commands — Unit Tests
 *
 * Tests: OS_UNDO → onUndo and OS_REDO → onRedo callback pipelines.
 * Note: These use BaseCommand (not ZoneCallback) for delegation.
 */

import { OS_REDO } from "@os/3-commands/interaction/redo";
import { OS_UNDO } from "@os/3-commands/interaction/undo";
import { kernel } from "@os/kernel";
import { describe, it } from "vitest";
import {
  registerZone,
  setupFocus,
  useKernelSnapshot,
} from "./helpers/os-command-helpers";

useKernelSnapshot();

// ═══════════════════════════════════════════════════════════════════
// OS_UNDO → onUndo
// ═══════════════════════════════════════════════════════════════════

describe("OS_UNDO → onUndo pipeline", () => {
  it("dispatches onUndo callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onUndo: { type: "mock/undo", payload: undefined },
    });

    kernel.dispatch(OS_UNDO());
  });

  it("does nothing when Zone has no onUndo", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    kernel.dispatch(OS_UNDO());
  });

  it("does nothing when no active zone", () => {
    kernel.dispatch(OS_UNDO());
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS_REDO → onRedo
// ═══════════════════════════════════════════════════════════════════

describe("OS_REDO → onRedo pipeline", () => {
  it("dispatches onRedo callback when Zone has it", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {
      onRedo: { type: "mock/redo", payload: undefined },
    });

    kernel.dispatch(OS_REDO());
  });

  it("does nothing when Zone has no onRedo", () => {
    setupFocus("testZone", "item-1");
    registerZone("testZone", {});

    kernel.dispatch(OS_REDO());
  });

  it("does nothing when no active zone", () => {
    kernel.dispatch(OS_REDO());
  });
});
