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

import { computeAttrs } from "@os-core/3-inject/compute";
import {
  readActiveZoneId,
  readFocusedItemId,
} from "@os-core/3-inject/readState";
import { os } from "@os-core/engine/kernel";
import { createPage } from "@os-testing/page";
import { describe, expect, it } from "vitest";
import { MenuShowcaseApp } from "@/pages/layer-showcase/patterns/MenuPattern";

const MENU_ZONE_ID = "layer-menu";
const TRIGGER_ID = "OpenMenuBtn";
const MENU_ITEMS = ["menu-cut", "menu-copy", "menu-paste", "menu-delete"];

function setup() {
  const { page } = createPage(MenuShowcaseApp);
  page.goto("/");
  return page;
}

describe("Layer Menu: Trigger → Open", () => {
  it("click trigger opens menu and focuses first item", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(readActiveZoneId(os)).toBe(MENU_ZONE_ID);
    expect(readFocusedItemId(os)).toBe(MENU_ITEMS[0]);
  });
});

describe("Layer Menu: Arrow Navigation", () => {
  it("ArrowDown moves to next item", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowDown");
    expect(readFocusedItemId(os)).toBe("menu-copy");
  });

  it("ArrowUp moves to previous item", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowUp");
    expect(readFocusedItemId(os)).toBe("menu-cut");
  });

  it("ArrowDown at last item wraps to first (loop)", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    expect(readFocusedItemId(os)).toBe("menu-delete");
    page.keyboard.press("ArrowDown");
    expect(readFocusedItemId(os)).toBe("menu-cut");
  });
});

describe("Layer Menu: Escape Dismiss", () => {
  it("Escape closes menu and restores focus to trigger", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(readActiveZoneId(os)).toBe(MENU_ZONE_ID);

    page.keyboard.press("Escape");
    expect(readActiveZoneId(os)).toBe("menu-trigger-zone");
    expect(readFocusedItemId(os, "menu-trigger-zone")).toBe(TRIGGER_ID);
  });
});

describe("Layer Menu: Focus Trap", () => {
  it("Tab wraps within menu (focus trap)", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(readFocusedItemId(os)).toBe("menu-cut");

    // Tab through all items
    page.keyboard.press("Tab");
    expect(readFocusedItemId(os)).toBe("menu-copy");
    page.keyboard.press("Tab");
    expect(readFocusedItemId(os)).toBe("menu-paste");
    page.keyboard.press("Tab");
    expect(readFocusedItemId(os)).toBe("menu-delete");
    page.keyboard.press("Tab");
    expect(readFocusedItemId(os)).toBe("menu-cut"); // wraps
    expect(readActiveZoneId(os)).toBe(MENU_ZONE_ID);
  });
});

describe("Layer Menu: ARIA Projection", () => {
  it("focused item tabIndex=0, others -1", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    expect(computeAttrs(os, "menu-cut").tabIndex).toBe(0);
    expect(computeAttrs(os, "menu-copy").tabIndex).toBe(-1);
  });

  it("items have role=menuitem", () => {
    const page = setup();
    page.click(TRIGGER_ID);
    for (const id of MENU_ITEMS) {
      expect(computeAttrs(os, id).role).toBe("menuitem");
    }
  });
});
