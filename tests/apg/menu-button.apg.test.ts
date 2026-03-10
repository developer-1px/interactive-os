/**
 * APG Menu Button Pattern — Contract Test (Playwright 동형)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 *
 * Composite: Trigger button + Popup menu
 * Config: vertical, loop, tab trap, Escape=close
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay";
import { createPage } from "@os-devtool/testing/page";
import { expect as osExpect } from "@os-devtool/testing/expect";
import type { Page } from "@os-devtool/testing/types";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, it } from "vitest";
import {
  assertHomeEnd,
  assertLoop,
  assertNoSelection,
  assertVerticalNav,
  assertFocusRestore,
} from "./helpers/contracts";

const expect = osExpect;

// ─── Config ───

const MENU_ITEMS = [
  "action-cut",
  "action-copy",
  "action-paste",
  "action-delete",
];

// ─── Factory ───

function createMenuButton(focusedItem = "action-cut"): { page: Page; cleanup: () => void } {
  const app = defineApp("test-menu-button", {});

  const trigger = app.createZone("trigger-bar");
  trigger.bind({
    role: "toolbar",
    getItems: () => ["menu-trigger"],
    triggers: {
      "menu-trigger": () =>
        OS_OVERLAY_OPEN({
          id: "popup-menu",
          type: "menu",
          entry: "first",
        }),
    },
  });

  const menu = app.createZone("popup-menu");
  menu.bind({
    role: "menu",
    getItems: () => MENU_ITEMS,
    options: {
      tab: { behavior: "trap" as const },
      dismiss: { escape: "close" as const },
    },
  });

  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click("menu-trigger"); // opens menu, focuses first item

  if (focusedItem && focusedItem !== "action-cut") {
    page.click(focusedItem);
  }

  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// Menu Navigation (vertical, loop, Home/End)
// ═══════════════════════════════════════════════════

describe("APG Menu Button: Menu Navigation", () => {
  assertVerticalNav(createMenuButton);
  assertHomeEnd(createMenuButton, {
    firstId: "action-cut",
    lastId: "action-delete",
  });
  assertNoSelection(createMenuButton, MENU_ITEMS);
  assertLoop({
    axis: "vertical",
    firstId: "action-cut",
    lastId: "action-delete",
    factoryAtFirst: () => createMenuButton("action-cut"),
    factoryAtLast: () => createMenuButton("action-delete"),
  });
});

// ═══════════════════════════════════════════════════
// Activation (Enter)
// ═══════════════════════════════════════════════════

describe("APG Menu Button: Activation", () => {
  it("Enter on menuitem: triggers activation (keeping focus)", async () => {
    const { page, cleanup } = createMenuButton("action-cut");
    page.keyboard.press("Enter");
    await expect(page.locator("#action-cut")).toBeFocused();
    cleanup();
  });

  it("Enter on any menuitem dispatches activation", async () => {
    const { page, cleanup } = createMenuButton("action-paste");
    page.keyboard.press("Enter");
    await expect(page.locator("#action-paste")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Dismiss (Escape) + Focus Restore
// ═══════════════════════════════════════════════════

describe("APG Menu Button: Dismiss", () => {
  assertFocusRestore(createMenuButton, { invokerItemId: "menu-trigger" });

  it("Escape closes menu and restores focus to trigger", async () => {
    const { page, cleanup } = createMenuButton("action-copy");
    page.keyboard.press("Escape");
    await expect(page.locator("#menu-trigger")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Tab Behavior (focus trap)
// ═══════════════════════════════════════════════════

describe("APG Menu Button: Tab Behavior", () => {
  it("Tab at last item wraps to first (focus trap)", async () => {
    const { page, cleanup } = createMenuButton("action-delete");
    page.keyboard.press("Tab");
    await expect(page.locator("#action-cut")).toBeFocused();
    cleanup();
  });

  it("Shift+Tab at first item wraps to last (focus trap)", async () => {
    const { page, cleanup } = createMenuButton("action-cut");
    page.keyboard.press("Shift+Tab");
    await expect(page.locator("#action-delete")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// ARIA Projection
// ═══════════════════════════════════════════════════

describe("APG Menu Button: ARIA Projection", () => {
  it("menu items have role=menuitem", async () => {
    const { page, cleanup } = createMenuButton();
    for (const id of MENU_ITEMS) {
      await expect(page.locator(`#${id}`)).toHaveAttribute("role", "menuitem");
    }
    cleanup();
  });

  it("focused item tabIndex=0, others -1", async () => {
    const { page, cleanup } = createMenuButton("action-cut");
    await expect(page.locator("#action-cut")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#action-copy")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#action-paste")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#action-delete")).toHaveAttribute("tabindex", "-1");
    cleanup();
  });

  it("focused item has data-focused=true", async () => {
    const { page, cleanup } = createMenuButton("action-copy");
    await expect(page.locator("#action-copy")).toHaveAttribute("data-focused", "true");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Click Interaction
// ═══════════════════════════════════════════════════

describe("APG Menu Button: Click", () => {
  it("click on menu item focuses it", async () => {
    const { page, cleanup } = createMenuButton("action-cut");
    page.click("action-paste");
    await expect(page.locator("#action-paste")).toBeFocused();
    cleanup();
  });
});
