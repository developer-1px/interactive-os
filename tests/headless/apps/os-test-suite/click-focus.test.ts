/**
 * OS Test Suite: Click → Focus Chain
 *
 * Verifies that headless click() produces the same focus state as browser click.
 * This is the most fundamental OS interaction chain.
 */

import { readFocusedItemId } from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import { ClickFocusApp } from "@/pages/os-test-suite/patterns/ClickFocusPattern";

function setup() {
  const { page } = createPage(ClickFocusApp);
  page.goto("/");
  return page;
}

describe("OS Pipeline: Click → Focus", () => {
  it("click item moves focus to that item", () => {
    const page = setup();

    page.click("item-c");

    expect(readFocusedItemId(os)).toBe("item-c");
  });

  it("click different item transfers focus", () => {
    const page = setup();

    page.click("item-a");
    expect(readFocusedItemId(os)).toBe("item-a");

    page.click("item-d");
    expect(readFocusedItemId(os)).toBe("item-d");
  });

  it("arrow down after click navigates from clicked position", () => {
    const page = setup();

    page.click("item-b");
    expect(readFocusedItemId(os)).toBe("item-b");

    page.keyboard.press("ArrowDown");
    expect(readFocusedItemId(os)).toBe("item-c");
  });

  it("arrow up after click navigates from clicked position", () => {
    const page = setup();

    page.click("item-d");
    page.keyboard.press("ArrowUp");

    expect(readFocusedItemId(os)).toBe("item-c");
  });

  it("click first item + Home stays at first", () => {
    const page = setup();

    page.click("item-a");
    page.keyboard.press("Home");

    expect(readFocusedItemId(os)).toBe("item-a");
  });

  it("click any item + End goes to last", () => {
    const page = setup();

    page.click("item-b");
    page.keyboard.press("End");

    expect(readFocusedItemId(os)).toBe("item-e");
  });
});
