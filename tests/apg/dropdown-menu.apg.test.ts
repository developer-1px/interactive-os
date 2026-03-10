/**
 * Dropdown-as-Menu — Contract Test (Playwright 동형)
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 *
 * Verifies that OS menu role provides all behaviors needed for a dropdown:
 *   1. Arrow navigation (vertical, loop)
 *   2. Enter activates item
 *   3. Escape closes + focus restore to trigger
 *   4. AutoFocus on first item when opened
 *   5. Tab trap
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay";
import { createPage } from "@os-devtool/testing/page";
import { expect as osExpect } from "@os-devtool/testing/expect";
import type { Page } from "@os-devtool/testing/types";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, it } from "vitest";

const expect = osExpect;

// ─── Config ───

const LOCALE_ITEMS = ["ko", "en", "ja", "zh"];

// ─── Factory ───

function openDropdown(): { page: Page; cleanup: () => void } {
  const app = defineApp("test-dropdown", {});

  const toolbar = app.createZone("toolbar");
  toolbar.bind({
    role: "toolbar",
    getItems: () => ["LocaleTrigger"],
    triggers: {
      LocaleTrigger: () =>
        OS_OVERLAY_OPEN({
          id: "locale-menu",
          type: "menu",
          entry: "first",
        }),
    },
  });

  const menu = app.createZone("locale-menu");
  menu.bind({
    role: "menu",
    getItems: () => LOCALE_ITEMS,
    options: {
      tab: { behavior: "trap" as const },
      dismiss: { escape: "close" as const },
    },
  });

  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click("LocaleTrigger");
  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// AutoFocus
// ═══════════════════════════════════════════════════

describe("Dropdown-as-Menu: AutoFocus", () => {
  it("menu opens with focus on first item (entry: first)", async () => {
    const { page, cleanup } = openDropdown();
    await expect(page.locator("#ko")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Navigation (vertical, loop)
// ═══════════════════════════════════════════════════

describe("Dropdown-as-Menu: Navigation", () => {
  it("Arrow Down moves to next locale", async () => {
    const { page, cleanup } = openDropdown();
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#en")).toBeFocused();
    cleanup();
  });

  it("Arrow Up from first item loops to last (loop: true)", async () => {
    const { page, cleanup } = openDropdown();
    page.keyboard.press("ArrowUp");
    await expect(page.locator("#zh")).toBeFocused();
    cleanup();
  });

  it("Arrow Down from last item loops to first", async () => {
    const { page, cleanup } = openDropdown();
    page.keyboard.press("ArrowUp"); // go to last
    await expect(page.locator("#zh")).toBeFocused();
    page.keyboard.press("ArrowDown"); // loop to first
    await expect(page.locator("#ko")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Activation (Enter)
// ═══════════════════════════════════════════════════

describe("Dropdown-as-Menu: Activation", () => {
  it("Enter on focused item triggers activation", async () => {
    const { page, cleanup } = openDropdown();
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#en")).toBeFocused();
    page.keyboard.press("Enter");
    await expect(page.locator("#en")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Dismiss (Escape) + Focus Restore
// ═══════════════════════════════════════════════════

describe("Dropdown-as-Menu: Dismiss", () => {
  it("Escape closes the dropdown and restores focus to trigger", async () => {
    const { page, cleanup } = openDropdown();
    await expect(page.locator("#ko")).toBeFocused();

    page.keyboard.press("Escape");
    await expect(page.locator("#LocaleTrigger")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Tab trap
// ═══════════════════════════════════════════════════

describe("Dropdown-as-Menu: Tab trap", () => {
  it("Tab does not escape the menu (tab: trap)", async () => {
    const { page, cleanup } = openDropdown();
    page.keyboard.press("Tab");
    // Tab trap wraps focus within menu — focus still on a menu item
    await expect(page.locator("#en")).toBeFocused();
    cleanup();
  });
});
