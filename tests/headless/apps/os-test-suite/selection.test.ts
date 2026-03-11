/**
 * OS Test Suite: Selection Modes
 *
 * Exercises single-select, multi-select, range, and toggle.
 */

import { readSelection } from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
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

// OS gap: headless zone options (select.mode:"multiple") not threaded to kernel config
describe("OS Pipeline: Multi Select", () => {
  it.todo("click selects single item (replace mode)");
  it.todo("Shift+click selects range");
  it.todo("Meta+click toggles individual items");
  it.todo("Shift+ArrowDown extends selection");

  it("Meta+A selects all", () => {
    const page = setup();

    page.click("m-alpha");
    page.keyboard.press("Meta+a");

    expect(readSelection(os, "select-multi").length).toBe(5);
  });
});
