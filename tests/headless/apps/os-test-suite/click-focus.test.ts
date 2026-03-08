/**
 * OS Test Suite: Click → Focus Chain
 *
 * Verifies that headless click() produces the same focus state as browser click.
 * This is the most fundamental OS interaction chain.
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { expect, describe, it } from "vitest";
import { ClickFocusApp } from "@/pages/os-test-suite/patterns/ClickFocusPattern";

function createPage() {
  const page = createHeadlessPage(ClickFocusApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Click → Focus", () => {
  it("click item moves focus to that item", () => {
    const page = createPage();

    page.click("item-c");

    expect(page.focusedItemId()).toBe("item-c");
  });

  it("click different item transfers focus", () => {
    const page = createPage();

    page.click("item-a");
    expect(page.focusedItemId()).toBe("item-a");

    page.click("item-d");
    expect(page.focusedItemId()).toBe("item-d");
  });

  it("arrow down after click navigates from clicked position", () => {
    const page = createPage();

    page.click("item-b");
    expect(page.focusedItemId()).toBe("item-b");

    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("item-c");
  });

  it("arrow up after click navigates from clicked position", () => {
    const page = createPage();

    page.click("item-d");
    page.keyboard.press("ArrowUp");

    expect(page.focusedItemId()).toBe("item-c");
  });

  it("click first item + Home stays at first", () => {
    const page = createPage();

    page.click("item-a");
    page.keyboard.press("Home");

    expect(page.focusedItemId()).toBe("item-a");
  });

  it("click any item + End goes to last", () => {
    const page = createPage();

    page.click("item-b");
    page.keyboard.press("End");

    expect(page.focusedItemId()).toBe("item-e");
  });
});
