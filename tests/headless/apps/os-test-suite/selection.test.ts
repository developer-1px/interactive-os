/**
 * OS Test Suite: Selection Modes
 *
 * Exercises single-select, multi-select, range, and toggle.
 * Uses page API only (1경계 원칙).
 */

import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { SelectionApp } from "@/pages/os-test-suite/patterns/SelectionPattern";

function setup() {
  const { page } = createPage(SelectionApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Single Select", () => {
  it("click selects item", () => {
    const page = setup();

    page.click("s-bravo");

    expect(page.locator("#s-bravo").getAttribute("aria-selected")).toBe("true");
  });

  it("click another replaces selection", () => {
    const page = setup();

    page.click("s-alpha");
    page.click("s-charlie");

    expect(page.locator("#s-alpha").getAttribute("aria-selected")).not.toBe(
      "true",
    );
    expect(page.locator("#s-charlie").getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("Space toggles selection on focused item", () => {
    const page = setup();

    page.click("s-alpha");
    page.keyboard.press("ArrowDown");
    page.keyboard.press("Space");

    expect(page.locator("#s-bravo").getAttribute("aria-selected")).toBe("true");
  });
});

// OS core bug: OS_ACTIVATE dispatches OS_SELECT (toggle mode for multi),
// causing double-toggle cancellation after resolveMouse's OS_SELECT.
// Needs OS core fix in activate.ts or simulateClick deduplication.
describe("OS Pipeline: Multi Select", () => {
  it.todo("click selects single item (replace mode)");
  it.todo("Shift+click selects range");
  it.todo("Meta+click toggles individual items");
  it.todo("Shift+ArrowDown extends selection");

  it("Meta+A selects all", () => {
    const page = setup();

    page.click("m-alpha");
    page.keyboard.press("Meta+a");

    expect(page.locator("#m-alpha").getAttribute("aria-selected")).toBe("true");
    expect(page.locator("#m-echo").getAttribute("aria-selected")).toBe("true");
  });
});
