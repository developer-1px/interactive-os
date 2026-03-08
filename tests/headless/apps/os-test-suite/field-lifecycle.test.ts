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

import { createHeadlessPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import {
  FieldLifecycleApp,
  setChangeValue,
  setEnterValue,
} from "@/pages/os-test-suite/patterns/FieldLifecyclePattern";

type AppPage = ReturnType<typeof createHeadlessPage>;

function createPage() {
  const page = createHeadlessPage(FieldLifecycleApp);
  page.goto("/");
  return page;
}

function appState(page: AppPage) {
  return (
    page as unknown as { state: { enterValue: string; changeValue: string } }
  ).state;
}

function dispatch(page: AppPage, cmd: unknown) {
  (page as unknown as { dispatch: (cmd: unknown) => void }).dispatch(cmd);
}

describe("OS Pipeline: Field — trigger:'enter'", () => {
  it("type + Enter commits value to app state (expected behavior)", () => {
    const page = createPage();

    page.keyboard.type("hello");
    page.keyboard.press("Enter");

    // GAP: Enter dispatches OS_ACTIVATE, not OS_FIELD_COMMIT in headless textbox.
    // Expected: "hello", Actual: "" — documenting as OS gap.
    // When this test starts passing, the gap is resolved.
    expect(appState(page).enterValue).toBe("hello");
  });

  it("type without Enter does NOT commit", () => {
    const page = createPage();

    page.keyboard.type("pending");

    expect(appState(page).enterValue).toBe("");
  });

  it("Escape cancels field edit (value not committed)", () => {
    const page = createPage();

    page.keyboard.type("will cancel");
    page.keyboard.press("Escape");

    expect(appState(page).enterValue).toBe("");
  });

  it("dispatch workaround commits enter value", () => {
    const page = createPage();
    dispatch(page, setEnterValue({ value: "manual" }));
    expect(appState(page).enterValue).toBe("manual");
  });
});

describe("OS Pipeline: Field — trigger:'change' (OG-013)", () => {
  it("type auto-commits on each change (expected behavior)", () => {
    const page = createPage();

    page.keyboard.press("Tab");
    page.keyboard.type("auto");

    // OG-013: trigger:"change" doesn't auto-commit in headless.
    // When this test starts passing, OG-013 is resolved.
    expect(appState(page).changeValue).toBe("auto");
  });

  it("dispatch workaround commits change value", () => {
    const page = createPage();
    dispatch(page, setChangeValue({ value: "dispatched" }));
    expect(appState(page).changeValue).toBe("dispatched");
  });

  it.todo(
    "change field commits on blur (OS gap: no blur simulation in headless)",
  );
});
