/**
 * Layer Playground: Menu — Overlay Lifecycle Test
 *
 * @spec docs/1-project/apg/layer-playground/blueprint-layer-playground.md #6
 *
 * Scenarios:
 *   1. Click trigger → menu opens, focus on first item
 *   2. ArrowDown/Up navigates with loop
 *   3. Escape closes menu and restores focus to trigger
 *   4. Tab traps within menu (focus trap)
 *   5. ARIA: focused item tabIndex=0, others -1
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { MenuShowcaseApp } from "@/pages/layer-showcase/patterns/MenuPattern";
import { describe, expect, it } from "vitest";

const MENU_ZONE_ID = "layer-menu";
const TRIGGER_ID = "open-menu-btn";
const MENU_ITEMS = ["menu-cut", "menu-copy", "menu-paste", "menu-delete"];

function createPage() {
  const page = createHeadlessPage(MenuShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer Menu: Trigger → Open", () => {
  it("click trigger opens menu and focuses first item", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.activeZoneId()).toBe(MENU_ZONE_ID);
    expect(page.focusedItemId()).toBe(MENU_ITEMS[0]);
  });
});

describe("Layer Menu: Arrow Navigation", () => {
  it("ArrowDown moves to next item", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("menu-copy");
  });

  it("ArrowUp moves to previous item", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowUp");
    expect(page.focusedItemId()).toBe("menu-cut");
  });

  it("ArrowDown at last item wraps to first (loop)", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("menu-delete");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("menu-cut");
  });
});

describe("Layer Menu: Escape Dismiss", () => {
  it("Escape closes menu and restores focus to trigger", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.activeZoneId()).toBe(MENU_ZONE_ID);

    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("menu-trigger-zone");
    expect(page.focusedItemId("menu-trigger-zone")).toBe(TRIGGER_ID);
  });
});

describe("Layer Menu: Focus Trap", () => {
  it("Tab wraps within menu (focus trap)", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.focusedItemId()).toBe("menu-cut");

    // Tab through all items
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("menu-copy");
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("menu-paste");
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("menu-delete");
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("menu-cut"); // wraps
    expect(page.activeZoneId()).toBe(MENU_ZONE_ID);
  });
});

describe("Layer Menu: ARIA Projection", () => {
  it("focused item tabIndex=0, others -1", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    expect(page.attrs("menu-cut").tabIndex).toBe(0);
    expect(page.attrs("menu-copy").tabIndex).toBe(-1);
  });

  it("items have role=menuitem", () => {
    const page = createPage();
    page.click(TRIGGER_ID);
    for (const id of MENU_ITEMS) {
      expect(page.attrs(id).role).toBe("menuitem");
    }
  });
});
