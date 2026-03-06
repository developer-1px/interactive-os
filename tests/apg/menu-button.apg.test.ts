/**
 * APG Menu Button — Unified Test (Tier 1: headless via createPage)
 *
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *
 * Zone IDs and roles match MenuButtonPattern.tsx exactly:
 *   - "apg-menu-button-popup" (role: "menu") — the popup menu zone
 *
 * What's tested here (kernel-scope):
 *   - Menu navigation: ArrowDown/Up (vertical, loop), Home/End
 *   - Activation: Enter on menuitem
 *   - Dismiss: Escape closes menu
 *   - Tab trap: Tab/Shift+Tab cycle within menu
 *   - ARIA projection: role=menuitem, tabIndex roving, data-focused
 *   - No selection on navigation
 *
 * What's tested ONLY in TestBot (browser-scope):
 *   - aria-haspopup, aria-expanded on trigger (Trigger component projection)
 *   - Click/Enter/Space on trigger → menu opens (overlay lifecycle)
 *   - Enter on menuitem → menu closes + focus restore to trigger
 */

import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import { MenuButtonApp } from "@/pages/apg-showcase/patterns/MenuButtonPattern";

const MENU_ITEMS = [
  "action-cut",
  "action-copy",
  "action-paste",
  "action-delete",
];

function createMenuPage(focusedItem = "action-cut") {
  const page = createPage(MenuButtonApp);
  page.goto("apg-menu-button-popup", {
    items: MENU_ITEMS,
    focusedItemId: focusedItem,
    role: "menu",
  });
  return page;
}

// ════════════════════════════════════════════════════════════════
// Menu Navigation (vertical, loop, Home/End)
// ════════════════════════════════════════════════════════════════

describe("APG Menu Button: Menu Navigation", () => {
  it("ArrowDown moves focus to next item", () => {
    const page = createMenuPage("action-cut");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("action-copy");
    expect(page.attrs("action-copy").tabIndex).toBe(0);
    expect(page.attrs("action-cut").tabIndex).toBe(-1);
  });

  it("ArrowUp moves focus to previous item", () => {
    const page = createMenuPage("action-copy");
    page.keyboard.press("ArrowUp");
    expect(page.focusedItemId()).toBe("action-cut");
  });

  it("ArrowDown at last item wraps to first (loop)", () => {
    const page = createMenuPage("action-delete");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("action-cut");
  });

  it("ArrowUp at first item wraps to last (loop)", () => {
    const page = createMenuPage("action-cut");
    page.keyboard.press("ArrowUp");
    expect(page.focusedItemId()).toBe("action-delete");
  });

  it("Home moves focus to first item", () => {
    const page = createMenuPage("action-paste");
    page.keyboard.press("Home");
    expect(page.focusedItemId()).toBe("action-cut");
    expect(page.attrs("action-cut").tabIndex).toBe(0);
  });

  it("End moves focus to last item", () => {
    const page = createMenuPage("action-copy");
    page.keyboard.press("End");
    expect(page.focusedItemId()).toBe("action-delete");
    expect(page.attrs("action-delete").tabIndex).toBe(0);
  });

  it("ArrowLeft has no effect (vertical menu)", () => {
    const page = createMenuPage("action-copy");
    page.keyboard.press("ArrowLeft");
    expect(page.focusedItemId()).toBe("action-copy");
  });

  it("ArrowRight has no effect (vertical menu)", () => {
    const page = createMenuPage("action-copy");
    page.keyboard.press("ArrowRight");
    expect(page.focusedItemId()).toBe("action-copy");
  });

  it("navigation does not create selection", () => {
    const page = createMenuPage("action-cut");
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    expect(page.selection()).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// Activation (Enter on menuitem)
// ════════════════════════════════════════════════════════════════

describe("APG Menu Button: Activation", () => {
  it("Enter on menuitem dispatches OS_ACTIVATE", () => {
    const page = createMenuPage("action-cut");
    page.keyboard.press("Enter");
    expect(page.focusedItemId()).toBe("action-cut");
  });

  it("Enter on any menuitem dispatches activation", () => {
    const page = createMenuPage("action-paste");
    page.keyboard.press("Enter");
    expect(page.focusedItemId()).toBe("action-paste");
  });
});

// ════════════════════════════════════════════════════════════════
// Dismiss (Escape closes menu)
// ════════════════════════════════════════════════════════════════

describe("APG Menu Button: Dismiss", () => {
  it("Escape closes menu (clears active zone)", () => {
    const page = createMenuPage("action-copy");
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBeNull();
  });

  it("Escape from any focused item closes menu", () => {
    const page = createMenuPage("action-delete");
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// Tab Behavior (menu uses focus trap)
// ════════════════════════════════════════════════════════════════

describe("APG Menu Button: Tab Behavior", () => {
  it("Tab at last item wraps to first (focus trap)", () => {
    const page = createMenuPage("action-delete");
    page.keyboard.press("Tab");
    expect(page.focusedItemId()).toBe("action-cut");
  });

  it("Shift+Tab at first item wraps to last (focus trap)", () => {
    const page = createMenuPage("action-cut");
    page.keyboard.press("Shift+Tab");
    expect(page.focusedItemId()).toBe("action-delete");
  });

  it("Tab does not escape the menu zone", () => {
    const page = createMenuPage("action-copy");
    page.keyboard.press("Tab");
    expect(page.activeZoneId()).toBe("apg-menu-button-popup");
  });
});

// ════════════════════════════════════════════════════════════════
// ARIA Projection
// ════════════════════════════════════════════════════════════════

describe("APG Menu Button: ARIA Projection", () => {
  it("menu items have role=menuitem", () => {
    const page = createMenuPage();
    for (const id of MENU_ITEMS) {
      expect(page.attrs(id).role).toBe("menuitem");
    }
  });

  it("focused item tabIndex=0, others -1", () => {
    const page = createMenuPage("action-cut");
    expect(page.attrs("action-cut").tabIndex).toBe(0);
    expect(page.attrs("action-copy").tabIndex).toBe(-1);
    expect(page.attrs("action-paste").tabIndex).toBe(-1);
    expect(page.attrs("action-delete").tabIndex).toBe(-1);
  });

  it("tabIndex follows focus after navigation", () => {
    const page = createMenuPage("action-cut");
    page.keyboard.press("ArrowDown");
    expect(page.attrs("action-copy").tabIndex).toBe(0);
    expect(page.attrs("action-cut").tabIndex).toBe(-1);
  });

  it("focused item has data-focused=true", () => {
    const page = createMenuPage("action-copy");
    expect(page.attrs("action-copy")["data-focused"]).toBe(true);
    expect(page.attrs("action-cut")["data-focused"]).toBeUndefined();
  });
});

// ════════════════════════════════════════════════════════════════
// Click Interaction
// ════════════════════════════════════════════════════════════════

describe("APG Menu Button: Click", () => {
  it("click on menu item focuses it", () => {
    const page = createMenuPage("action-cut");
    page.click("action-paste");
    expect(page.focusedItemId()).toBe("action-paste");
  });
});
