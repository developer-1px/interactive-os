/**
 * OS Test Suite: Expand / Collapse
 *
 * Exercises disclosure expand/collapse and initial state.
 */

import { computeAttrs } from "@os-core/3-inject/compute";
import { os } from "@os-core/engine/kernel";
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
    page.click("section-a"); // bootstrap

    expect(computeAttrs(os, "section-a")["aria-expanded"]).toBe(true);
  });

  it("section-b starts collapsed", () => {
    const page = setup();
    page.click("section-b");

    expect(computeAttrs(os, "section-b")["aria-expanded"]).toBe(false);
  });

  it("section-c starts collapsed", () => {
    const page = setup();
    page.click("section-c");

    expect(computeAttrs(os, "section-c")["aria-expanded"]).toBe(false);
  });
});

describe("OS Pipeline: Expand — Toggle", () => {
  it("Enter toggles expanded state", () => {
    const page = setup();

    page.click("section-b");
    expect(computeAttrs(os, "section-b")["aria-expanded"]).toBe(false);

    page.keyboard.press("Enter");
    expect(computeAttrs(os, "section-b")["aria-expanded"]).toBe(true);

    page.keyboard.press("Enter");
    expect(computeAttrs(os, "section-b")["aria-expanded"]).toBe(false);
  });

  it("Space toggles expanded state", () => {
    const page = setup();

    page.click("section-c");
    page.keyboard.press("Space");

    expect(computeAttrs(os, "section-c")["aria-expanded"]).toBe(true);
  });

  it("click toggles expanded state (via inputmap)", () => {
    const page = setup();

    // section-a starts expanded, click to collapse
    page.click("section-a");
    expect(computeAttrs(os, "section-a")["aria-expanded"]).toBe(true);

    page.click("section-a");
    expect(computeAttrs(os, "section-a")["aria-expanded"]).toBe(false);
  });

  it("multiple items expand independently", () => {
    const page = setup();

    page.click("section-b");
    page.keyboard.press("Enter"); // expand b

    page.keyboard.press("ArrowDown");
    page.keyboard.press("Enter"); // expand c

    expect(computeAttrs(os, "section-a")["aria-expanded"]).toBe(true); // initial
    expect(computeAttrs(os, "section-b")["aria-expanded"]).toBe(true);
    expect(computeAttrs(os, "section-c")["aria-expanded"]).toBe(true);
  });
});
