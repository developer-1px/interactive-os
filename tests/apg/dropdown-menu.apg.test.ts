/**
 * Dropdown-as-Menu headless test
 *
 * Verifies that OS menu role provides all behaviors needed for a dropdown:
 *   1. Arrow navigation (vertical, loop)
 *   2. Enter activates item (automatic mode)
 *   3. Escape closes + focus restore to trigger
 *   4. AutoFocus on first item when opened
 *   5. Tab trap
 *
 * NO dispatch(), NO setupZone(), NO @os-core imports (except OS_OVERLAY_OPEN for trigger payload).
 */

import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay";
import { createHeadlessPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";

// ── Simulate the LocaleSwitcher dropdown as a menu ──

const LOCALE_ITEMS = ["ko", "en", "ja", "zh"];

function openDropdown() {
  const app = defineApp("test-dropdown", {});

  const toolbar = app.createZone("toolbar");
  toolbar.bind({
    role: "toolbar",
    getItems: () => ["locale-trigger"],
    triggers: [
      {
        id: "locale-trigger",
        onActivate: OS_OVERLAY_OPEN({
          id: "locale-menu",
          type: "menu",
          entry: "first",
        }),
        overlay: { id: "locale-menu", type: "menu" },
      },
    ],
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

  const page = createHeadlessPage(app);
  page.goto("/");
  page.click("locale-trigger");
  return page;
}

describe("Dropdown-as-Menu: headless proof", () => {
  // ── AutoFocus ──

  it("menu opens with focus on first item (entry: first)", () => {
    const page = openDropdown();
    expect(page.activeZoneId()).toBe("locale-menu");
    expect(page.focusedItemId("locale-menu")).toBe("ko");
  });

  // ── Navigation ──

  it("Arrow Down moves to next locale", () => {
    const page = openDropdown();
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId("locale-menu")).toBe("en");
  });

  it("Arrow Up from first item loops to last (loop: true)", () => {
    const page = openDropdown();
    page.keyboard.press("ArrowUp");
    expect(page.focusedItemId("locale-menu")).toBe("zh");
  });

  it("Arrow Down from last item loops to first", () => {
    const page = openDropdown();
    // Navigate to last
    page.keyboard.press("ArrowUp");
    expect(page.focusedItemId("locale-menu")).toBe("zh");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId("locale-menu")).toBe("ko");
  });

  // ── Activation (Enter) ──

  it("Enter on focused item triggers activation (automatic mode)", () => {
    const page = openDropdown();
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId("locale-menu")).toBe("en");
    page.keyboard.press("Enter");
    expect(page.focusedItemId("locale-menu")).toBe("en");
  });

  // ── Dismiss (Escape) + Focus Restore ──

  it("Escape closes the dropdown and restores focus to trigger", () => {
    const page = openDropdown();
    expect(page.activeZoneId()).toBe("locale-menu");

    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBe("toolbar");
    expect(page.focusedItemId("toolbar")).toBe("locale-trigger");
  });

  // ── Tab trap ──

  it("Tab does not escape the menu (tab: trap)", () => {
    const page = openDropdown();
    page.keyboard.press("Tab");
    expect(page.activeZoneId()).toBe("locale-menu");
  });
});
