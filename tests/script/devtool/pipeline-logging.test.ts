/**
 * T3: OS pipeline logging — keybindings, focus, middleware
 *
 * Verifies that the OS pipeline produces DEBUG-level logs
 * at key points: keybinding resolution, focus changes, and
 * middleware command transformations.
 *
 * These logs enable the "Always Record, Print on Failure"
 * pattern via dumpDiagnostics().
 *
 * 🔴 RED: OS pipeline currently produces no debug logs.
 */

import { createOsPage, type OsPage } from "@os-sdk/app/defineApp/page";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("T3: OS pipeline debug logging", () => {
  let page: OsPage;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    page = createOsPage();
    page.goto("test-zone", {
      role: "listbox",
      items: ["a", "b", "c"],
    });
  });

  afterEach(() => {
    debugSpy.mockRestore();
    page.cleanup();
  });

  // ── Keybinding resolution ───────────────────────────────────
  it("#1 keyboard press produces a keybinding debug log", () => {
    page.keyboard.press("ArrowDown");

    const logs = debugSpy.mock.calls.map((c: unknown[]) => c.join(" "));
    const keybindLog = logs.find((msg: string) => msg.includes("[keybind]"));
    expect(keybindLog).toBeDefined();
    expect(keybindLog).toContain("ArrowDown");
  });

  // ── Dispatch ────────────────────────────────────────────────
  it("#2 command dispatch produces a dispatch debug log", () => {
    page.keyboard.press("ArrowDown");

    const logs = debugSpy.mock.calls.map((c: unknown[]) => c.join(" "));
    const dispatchLog = logs.find((msg: string) => msg.includes("[dispatch]"));
    expect(dispatchLog).toBeDefined();
    expect(dispatchLog).toContain("OS_NAVIGATE");
  });

  // ── Focus change ─────────────────────────────────────────────
  it("#3 focus change produces a focus info log", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    page.keyboard.press("ArrowDown");

    const logs = infoSpy.mock.calls.map((c: unknown[]) => c.join(" "));
    const focusLog = logs.find((msg: string) => msg.includes("[focus]"));
    expect(focusLog).toBeDefined();

    infoSpy.mockRestore();
  });
});
