/**
 * OS Test Suite: Field Lifecycle
 *
 * Verifies field commit triggers in headless.
 *
 * Gap findings:
 *   - OG-013: trigger:"change" doesn't auto-commit in headless
 *   - NEW: trigger:"enter" — Enter dispatches OS_ACTIVATE instead of OS_FIELD_COMMIT
 *     in textbox role headless. Field commit pipeline not connected.
 */

import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import {
  FieldLifecycleApp,
  setChangeValue,
  setEnterValue,
} from "@/pages/os-test-suite/patterns/FieldLifecyclePattern";

function setup() {
  const { page } = createPage(FieldLifecycleApp);
  page.goto("/");
  return page;
}

function appState() {
  return os.getState().apps[FieldLifecycleApp.__appId] as {
    enterValue: string;
    changeValue: string;
  };
}

describe("OS Pipeline: Field — trigger:'enter'", () => {
  it("type + Enter commits value to app state (expected behavior)", () => {
    const page = setup();

    page.keyboard.type("hello");
    page.keyboard.press("Enter");

    // GAP: Enter dispatches OS_ACTIVATE, not OS_FIELD_COMMIT in headless textbox.
    // Expected: "hello", Actual: "" — documenting as OS gap.
    // When this test starts passing, the gap is resolved.
    expect(appState().enterValue).toBe("hello");
  });

  it("type without Enter does NOT commit", () => {
    const page = setup();

    page.keyboard.type("pending");

    expect(appState().enterValue).toBe("");
  });

  it("Escape cancels field edit (value not committed)", () => {
    const page = setup();

    page.keyboard.type("will cancel");
    page.keyboard.press("Escape");

    expect(appState().enterValue).toBe("");
  });

  it("dispatch workaround commits enter value", () => {
    setup();
    os.dispatch(setEnterValue({ value: "manual" }));
    expect(appState().enterValue).toBe("manual");
  });
});

describe("OS Pipeline: Field — trigger:'change' (OG-013)", () => {
  it("type auto-commits on each change (expected behavior)", () => {
    const page = setup();

    page.keyboard.press("Tab");
    page.keyboard.type("auto");

    // OG-013: trigger:"change" doesn't auto-commit in headless.
    // When this test starts passing, OG-013 is resolved.
    expect(appState().changeValue).toBe("auto");
  });

  it("dispatch workaround commits change value", () => {
    setup();
    os.dispatch(setChangeValue({ value: "dispatched" }));
    expect(appState().changeValue).toBe("dispatched");
  });

  it.todo(
    "change field commits on blur (OS gap: no blur simulation in headless)",
  );
});
