/**
 * OS Test Suite: Selection Modes
 *
 * Exercises single-select, multi-select, range, and toggle.
 */

import { readSelection } from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-devtool/testing/page";
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

    expect(readSelection(os, "select-single")).toEqual(["s-bravo"]);
  });

  it("click another replaces selection", () => {
    const page = setup();

    page.click("s-alpha");
    page.click("s-charlie");

    expect(readSelection(os, "select-single")).toEqual(["s-charlie"]);
  });

  it("Space toggles selection on focused item", () => {
    const page = setup();

    page.click("s-alpha");
    page.keyboard.press("ArrowDown");
    page.keyboard.press("Space");

    expect(readSelection(os, "select-single")).toEqual(["s-bravo"]);
  });
});

describe("OS Pipeline: Multi Select", () => {
  it("click selects single item (replace mode)", () => {
    const page = setup();

    page.click("m-bravo");

    expect(readSelection(os, "select-multi")).toEqual(["m-bravo"]);
  });

  it("Shift+click selects range", () => {
    const page = setup();

    page.click("m-bravo");
    page.click("m-delta", { shift: true });

    const sel = readSelection(os, "select-multi");
    expect(sel).toContain("m-bravo");
    expect(sel).toContain("m-charlie");
    expect(sel).toContain("m-delta");
  });

  it("Meta+click toggles individual items", () => {
    const page = setup();

    page.click("m-alpha");
    page.click("m-charlie", { meta: true });

    const sel = readSelection(os, "select-multi");
    expect(sel).toContain("m-alpha");
    expect(sel).toContain("m-charlie");
    expect(sel.length).toBe(2);
  });

  it("Shift+ArrowDown extends selection", () => {
    const page = setup();

    page.click("m-alpha");
    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Shift+ArrowDown");

    const sel = readSelection(os, "select-multi");
    expect(sel).toContain("m-alpha");
    expect(sel).toContain("m-bravo");
    expect(sel).toContain("m-charlie");
  });

  it("Meta+A selects all", () => {
    const page = setup();

    page.click("m-alpha");
    page.keyboard.press("Meta+a");

    expect(readSelection(os, "select-multi").length).toBe(5);
  });
});
