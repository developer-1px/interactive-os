/**
 * OS Test Suite: Expand / Collapse
 *
 * Exercises disclosure expand/collapse chain:
 *   1. Initial expand state from config
 *   2. Enter/Space toggles aria-expanded
 *   3. Click toggles (via inputmap)
 *   4. Multiple items expand independently
 *
 * Key behavior: disclosure has click=[OS_EXPAND(toggle)] in inputmap,
 * so every click both focuses AND toggles expand state.
 */

import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { ExpandApp } from "@/pages/os-test-suite/patterns/ExpandPattern";

function setup() {
  const { page } = createPage(ExpandApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Expand — Initial State", () => {
  it("section-a starts expanded (initial config)", () => {
    const page = setup();

    expect(page.locator("#section-a").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("section-b starts collapsed", () => {
    const page = setup();

    // expand.mode: "all" → all items have aria-expanded, collapsed = "false"
    expect(page.locator("#section-b").getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("section-c starts collapsed", () => {
    const page = setup();

    expect(page.locator("#section-c").getAttribute("aria-expanded")).toBe(
      "false",
    );
  });
});

describe("OS Pipeline: Expand — Toggle", () => {
  it("Enter toggles expanded state", () => {
    const page = setup();

    // Click section-b → focus + toggle (false→true via click inputmap)
    page.click("section-b");
    expect(page.locator("#section-b").getAttribute("aria-expanded")).toBe(
      "true",
    );

    // Enter toggles back (true→false)
    page.keyboard.press("Enter");
    expect(page.locator("#section-b").getAttribute("aria-expanded")).toBe(
      "false",
    );

    // Enter toggles again (false→true)
    page.keyboard.press("Enter");
    expect(page.locator("#section-b").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("Space toggles expanded state", () => {
    const page = setup();

    // Click section-c → focus + toggle (false→true)
    page.click("section-c");
    expect(page.locator("#section-c").getAttribute("aria-expanded")).toBe(
      "true",
    );

    // Space toggles back (true→false)
    page.keyboard.press("Space");
    expect(page.locator("#section-c").getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("click toggles expanded state (via inputmap)", () => {
    const page = setup();

    // section-a starts expanded
    expect(page.locator("#section-a").getAttribute("aria-expanded")).toBe(
      "true",
    );

    // Click toggles (true→false) — first click = focus + toggle
    page.click("section-a");
    expect(page.locator("#section-a").getAttribute("aria-expanded")).toBe(
      "false",
    );

    // Re-click toggles (false→true)
    page.click("section-a");
    expect(page.locator("#section-a").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("multiple items expand independently", () => {
    const page = setup();

    // Click section-b → focus + toggle (false→true)
    page.click("section-b");
    // ArrowDown → focus section-c
    page.keyboard.press("ArrowDown");
    // Enter → toggle section-c (false→true)
    page.keyboard.press("Enter");

    expect(page.locator("#section-a").getAttribute("aria-expanded")).toBe(
      "true",
    ); // initial
    expect(page.locator("#section-b").getAttribute("aria-expanded")).toBe(
      "true",
    ); // click toggled
    expect(page.locator("#section-c").getAttribute("aria-expanded")).toBe(
      "true",
    ); // Enter toggled
  });
});
