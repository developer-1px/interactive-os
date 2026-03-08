/**
 * Overlay Handle API — Phase 2 Red Tests
 *
 * @spec docs/1-project/os-core/action-centric-trigger/notes/2026-0309-0100-[plan]-wrapper-elimination.md
 *
 * Verifies that zone.overlay() returns OverlayHandle (not CompoundTriggerComponents).
 * OverlayHandle = { overlayId, trigger } — no React components.
 *
 * These tests MUST FAIL until the API is migrated.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import { describe, expect, it } from "vitest";

interface TestState {
  count: number;
}
const INITIAL: TestState = { count: 0 };

describe("Feature: zone.overlay() → OverlayHandle", () => {
  it("returns overlayId string", () => {
    const App = defineApp<TestState>("overlay-handle-test", INITIAL);
    const zone = App.createZone("main");

    const handle = zone.overlay("my-dialog", { role: "dialog" });

    expect(handle.overlayId).toBe("my-dialog");
  });

  it("returns trigger prop-getter (not React component)", () => {
    const App = defineApp<TestState>("overlay-handle-test", INITIAL);
    const zone = App.createZone("main");

    const handle = zone.overlay("my-dialog", { role: "dialog" });

    // trigger is a function that returns data-attributes
    expect(typeof handle.trigger).toBe("function");

    const attrs = handle.trigger();
    expect(attrs["data-trigger-id"]).toBe("my-dialog-trigger");
    expect(attrs["aria-haspopup"]).toBe("dialog");
    expect(attrs["aria-controls"]).toBe("my-dialog");
  });

  it("menu role returns aria-haspopup=true", () => {
    const App = defineApp<TestState>("overlay-handle-test", INITIAL);
    const zone = App.createZone("main");

    const handle = zone.overlay("my-menu", { role: "menu" });

    const attrs = handle.trigger();
    expect(attrs["data-trigger-id"]).toBe("my-menu-trigger");
    expect(attrs["aria-haspopup"]).toBe("true");
    expect(attrs["aria-controls"]).toBe("my-menu");
  });

  it("does NOT return React compound components (Root, Portal, Popover, Content, Dismiss, Confirm)", () => {
    const App = defineApp<TestState>("overlay-handle-test", INITIAL);
    const zone = App.createZone("main");

    const handle = zone.overlay("my-dialog", { role: "dialog" });

    // These should NOT exist on the new API
    expect(handle).not.toHaveProperty("Root");
    expect(handle).not.toHaveProperty("Portal");
    expect(handle).not.toHaveProperty("Popover");
    expect(handle).not.toHaveProperty("Content");
    expect(handle).not.toHaveProperty("Dismiss");
    expect(handle).not.toHaveProperty("Confirm");
  });

  it("only has overlayId and trigger — minimal surface", () => {
    const App = defineApp<TestState>("overlay-handle-test", INITIAL);
    const zone = App.createZone("main");

    const handle = zone.overlay("my-menu", { role: "menu" });

    const keys = Object.keys(handle);
    expect(keys).toContain("overlayId");
    expect(keys).toContain("trigger");
    expect(keys.length).toBe(2);
  });
});
