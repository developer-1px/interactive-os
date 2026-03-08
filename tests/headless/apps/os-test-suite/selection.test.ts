/**
 * OS Test Suite: Selection Modes
 *
 * Exercises single-select, multi-select, range, and toggle.
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { expect, describe, it } from "vitest";
import { SelectionApp } from "@/pages/os-test-suite/patterns/SelectionPattern";

function createPage() {
  const page = createHeadlessPage(SelectionApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Single Select", () => {
  it("click selects item", () => {
    const page = createPage();

    page.click("s-bravo");

    expect(page.selection("select-single")).toEqual(["s-bravo"]);
  });

  it("click another replaces selection", () => {
    const page = createPage();

    page.click("s-alpha");
    page.click("s-charlie");

    expect(page.selection("select-single")).toEqual(["s-charlie"]);
  });

  it("Space toggles selection on focused item", () => {
    const page = createPage();

    page.click("s-alpha");
    page.keyboard.press("ArrowDown");
    page.keyboard.press("Space");

    expect(page.selection("select-single")).toEqual(["s-bravo"]);
  });
});

describe("OS Pipeline: Multi Select", () => {
  it("click selects single item (replace mode)", () => {
    const page = createPage();

    page.click("m-bravo");

    expect(page.selection("select-multi")).toEqual(["m-bravo"]);
  });

  it("Shift+click selects range", () => {
    const page = createPage();

    page.click("m-bravo");
    page.click("m-delta", { shift: true });

    const sel = page.selection("select-multi");
    expect(sel).toContain("m-bravo");
    expect(sel).toContain("m-charlie");
    expect(sel).toContain("m-delta");
  });

  it("Meta+click toggles individual items", () => {
    const page = createPage();

    page.click("m-alpha");
    page.click("m-charlie", { meta: true });

    const sel = page.selection("select-multi");
    expect(sel).toContain("m-alpha");
    expect(sel).toContain("m-charlie");
    expect(sel.length).toBe(2);
  });

  it("Shift+ArrowDown extends selection", () => {
    const page = createPage();

    page.click("m-alpha");
    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Shift+ArrowDown");

    const sel = page.selection("select-multi");
    expect(sel).toContain("m-alpha");
    expect(sel).toContain("m-bravo");
    expect(sel).toContain("m-charlie");
  });

  it("Meta+A selects all", () => {
    const page = createPage();

    page.click("m-alpha");
    page.keyboard.press("Meta+a");

    expect(page.selection("select-multi").length).toBe(5);
  });
});
