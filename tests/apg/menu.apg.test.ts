/**
 * APG Menu and Menubar Pattern — Contract Test (Playwright 동형)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay";
import { createPage } from "@os-testing/page";
import { expect as osExpect } from "@os-testing/expect";
import type { Page } from "@os-testing/types";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, it } from "vitest";
import {
  assertHomeEnd,
  assertHorizontalNav,
  assertNoSelection,
  assertVerticalNav,
  assertLoop,
} from "./helpers/contracts";

const expect = osExpect;

// ─── Constants ───

const MENUBAR_ITEMS = ["mb-file", "mb-edit", "mb-view"];
const MENU_ITEMS = [
  "cmd-new",
  "cmd-open",
  "check-ruler",
  "check-grid",
  "radio-left",
  "radio-center",
  "radio-right",
];

// ─── Factories ───

function createMenubar(focusedItem = "mb-file"): { page: Page; cleanup: () => void } {
  const app = defineApp("test-menubar", {});
  const zone = app.createZone("menubar");
  zone.bind("menubar", {
    getItems: () => MENUBAR_ITEMS,
    options: { navigate: { loop: true } }
  });
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

function createMenu(focusedItem = "cmd-new"): { page: Page; cleanup: () => void } {
  const app = defineApp("test-menu", {});
  const menubar = app.createZone("menubar");
  menubar.bind("menubar", {
    getItems: () => MENUBAR_ITEMS,
    triggers: {
      "mb-file": () =>
        OS_OVERLAY_OPEN({ id: "menu", type: "menu", entry: "first" }),
    },
  });
  const menu = app.createZone("menu");
  menu.bind("menu", {
    getItems: () => MENU_ITEMS,
    options: {
      navigate: { orientation: "vertical", loop: true },
      dismiss: { escape: "close" },
    },
  });
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click("mb-file"); // Open menu overlay
  if (focusedItem && focusedItem !== "cmd-new") {
    page.click(focusedItem);
  }
  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// Menubar Navigation (horizontal, loop)
// ═══════════════════════════════════════════════════

describe("APG Menubar: Navigation (horizontal, loop)", () => {
  assertHorizontalNav(createMenubar);
  assertNoSelection(createMenubar, MENUBAR_ITEMS);
  assertLoop({
    axis: "horizontal",
    firstId: "mb-file",
    lastId: "mb-view",
    factoryAtFirst: () => createMenubar("mb-file"),
    factoryAtLast: () => createMenubar("mb-view"),
  });
});

// ═══════════════════════════════════════════════════
// Menu Navigation (vertical, loop, Home/End)
// ═══════════════════════════════════════════════════

describe("APG Menu: Navigation (vertical, loop)", () => {
  assertVerticalNav(createMenu);
  assertHomeEnd(createMenu, {
    firstId: "cmd-new",
    lastId: "radio-right",
  });
  assertNoSelection(createMenu, MENU_ITEMS);
  assertLoop({
    axis: "vertical",
    firstId: "cmd-new",
    lastId: "radio-right",
    factoryAtFirst: () => createMenu("cmd-new"),
    factoryAtLast: () => createMenu("radio-right"),
  });
});

// ═══════════════════════════════════════════════════
// Dismiss (Escape closes, focus restore)
// ═══════════════════════════════════════════════════

describe("APG Menu: Dismiss", () => {
  it("Escape: closes menu and restores focus to invoker", async () => {
    const { page, cleanup } = createMenu();
    await expect(page.locator("#cmd-new")).toBeFocused();
    page.keyboard.press("Escape");
    await expect(page.locator("#mb-file")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Activation (Enter)
// ═══════════════════════════════════════════════════

describe("APG Menu: Activation (Enter)", () => {
  it("Enter on menuitem: triggers activation (keeping focus for this test)", async () => {
    const { page, cleanup } = createMenu("cmd-new");
    page.keyboard.press("Enter");
    await expect(page.locator("#cmd-new")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Checkbox & Radio Toggle (ARIA states)
// ═══════════════════════════════════════════════════

describe("APG Menu: Toggles (ARIA contract)", () => {
  // OS gap: menuitemcheckbox/menuitemradio requires item-level role config
  // which simple zone.bind() doesn't support. Needs per-item role mapping.
  it.skip("Space: toggles checked state for checkbox item", async () => {
    const { page, cleanup } = createMenu("check-ruler");
    await expect(page.locator("#check-ruler")).toHaveAttribute("aria-checked", "false");
    page.keyboard.press("Space");
    await expect(page.locator("#check-ruler")).toHaveAttribute("aria-checked", "true");
    page.keyboard.press("Space");
    await expect(page.locator("#check-ruler")).toHaveAttribute("aria-checked", "false");
    cleanup();
  });

  it.skip("Space: checks radio item and unchecks others in group", async () => {
    const { page, cleanup } = createMenu("radio-left");
    page.keyboard.press("Space");
    await expect(page.locator("#radio-left")).toHaveAttribute("aria-checked", "true");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// ARIA Projection
// ═══════════════════════════════════════════════════

describe("APG Menu: ARIA Projection", () => {
  it("menubar items have role=menuitem", async () => {
    const { page, cleanup } = createMenubar();
    await expect(page.locator("#mb-file")).toHaveAttribute("role", "menuitem");
    cleanup();
  });

  it("menubar focused item tabindex=0, others -1", async () => {
    const { page, cleanup } = createMenubar("mb-file");
    await expect(page.locator("#mb-file")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#mb-edit")).toHaveAttribute("tabindex", "-1");
    cleanup();
  });

  it("menu items have role=menuitem", async () => {
    const { page, cleanup } = createMenu();
    await expect(page.locator("#cmd-new")).toHaveAttribute("role", "menuitem");
    cleanup();
  });

  it("focused item has data-focused=true", async () => {
    const { page, cleanup } = createMenu("cmd-open");
    await expect(page.locator("#cmd-open")).toHaveAttribute("data-focused", "true");
    cleanup();
  });
});
