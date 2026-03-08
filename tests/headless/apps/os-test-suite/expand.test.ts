/**
 * OS Test Suite: Expand / Collapse
 *
 * Exercises disclosure expand/collapse and initial state.
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import { ExpandApp } from "@/pages/os-test-suite/patterns/ExpandPattern";

function createPage() {
  const page = createHeadlessPage(ExpandApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Expand — Initial State", () => {
  it("section-a starts expanded (initial config)", () => {
    const page = createPage();
    page.click("section-a"); // bootstrap

    expect(page.attrs("section-a")["aria-expanded"]).toBe(true);
  });

  it("section-b starts collapsed", () => {
    const page = createPage();
    page.click("section-b");

    expect(page.attrs("section-b")["aria-expanded"]).toBe(false);
  });

  it("section-c starts collapsed", () => {
    const page = createPage();
    page.click("section-c");

    expect(page.attrs("section-c")["aria-expanded"]).toBe(false);
  });
});

describe("OS Pipeline: Expand — Toggle", () => {
  it("Enter toggles expanded state", () => {
    const page = createPage();

    page.click("section-b");
    expect(page.attrs("section-b")["aria-expanded"]).toBe(false);

    page.keyboard.press("Enter");
    expect(page.attrs("section-b")["aria-expanded"]).toBe(true);

    page.keyboard.press("Enter");
    expect(page.attrs("section-b")["aria-expanded"]).toBe(false);
  });

  it("Space toggles expanded state", () => {
    const page = createPage();

    page.click("section-c");
    page.keyboard.press("Space");

    expect(page.attrs("section-c")["aria-expanded"]).toBe(true);
  });

  it("click toggles expanded state (via inputmap)", () => {
    const page = createPage();

    // section-a starts expanded, click to collapse
    page.click("section-a");
    expect(page.attrs("section-a")["aria-expanded"]).toBe(true);

    page.click("section-a");
    expect(page.attrs("section-a")["aria-expanded"]).toBe(false);
  });

  it("multiple items expand independently", () => {
    const page = createPage();

    page.click("section-b");
    page.keyboard.press("Enter"); // expand b

    page.keyboard.press("ArrowDown");
    page.keyboard.press("Enter"); // expand c

    expect(page.attrs("section-a")["aria-expanded"]).toBe(true); // initial
    expect(page.attrs("section-b")["aria-expanded"]).toBe(true);
    expect(page.attrs("section-c")["aria-expanded"]).toBe(true);
  });
});
