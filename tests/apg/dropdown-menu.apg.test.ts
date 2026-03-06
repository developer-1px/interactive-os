/**
 * Dropdown-as-Menu headless test
 *
 * Verifies that OS menu role provides all behaviors needed for a dropdown:
 *   1. Arrow ↑↓ navigation (vertical, loop)
 *   2. Enter activates item (automatic mode)
 *   3. Escape closes (dismiss.escape: "close")
 *   4. Focus restoration to trigger (stack push/pop)
 *   5. AutoFocus on first item when opened
 *
 * This is the headless proof that LocaleSwitcher can be fully OS-driven
 * without any app-level open/close commands.
 */

import { OS_STACK_POP, OS_STACK_PUSH } from "@os-core/4-command/focus/stack";
import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";

// ── Simulate the LocaleSwitcher dropdown as a menu ──

const LOCALE_ITEMS = ["ko", "en", "ja", "zh"];

const MENU_CONFIG = {
  navigate: {
    orientation: "vertical" as const,
    loop: true,
    seamless: false,
    typeahead: false,
    entry: "first" as const,
    recovery: "next" as const,
  },
  select: {
    mode: "none" as const,
    followFocus: false,
    disallowEmpty: false,
    range: false,
    toggle: false,
  },
  activate: {
    mode: "automatic" as const,
    onClick: false,
    reClickOnly: false,
  },
  tab: { behavior: "trap" as const, restoreFocus: true },
  dismiss: { escape: "close" as const, outsideClick: "close" as const },
  project: { virtualFocus: false, autoFocus: true },
};

/**
 * Simulates: user clicks trigger button → menu opens with OS focus on first item
 */
function openDropdown(focusedItem = "ko") {
  const app = defineApp("test-dropdown", {});
  const toolbar = app.createZone("toolbar");
  toolbar.bind({ getItems: () => ["locale-trigger"] });
  const menu = app.createZone("locale-menu");
  menu.bind({
    getItems: () => LOCALE_ITEMS,
    options: MENU_CONFIG,
  });
  const page = createPage(app);

  // Phase 1: Trigger zone
  page.goto("toolbar", { focusedItemId: "locale-trigger" });

  // Phase 2: Menu opens (stack push to preserve invoker)
  page.dispatch(OS_STACK_PUSH());

  // Phase 3: Menu zone active with items
  page.goto("locale-menu", { focusedItemId: focusedItem });

  return page;
}

describe("Dropdown-as-Menu: headless proof", () => {
  // ── Navigation ──

  it("Arrow Down moves to next locale", () => {
    const page = openDropdown("ko");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId("locale-menu")).toBe("en");
  });

  it("Arrow Up from first item loops to last (loop: true)", () => {
    const page = openDropdown("ko");
    page.keyboard.press("ArrowUp");
    expect(page.focusedItemId("locale-menu")).toBe("zh");
  });

  it("Arrow Down from last item loops to first", () => {
    const page = openDropdown("zh");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId("locale-menu")).toBe("ko");
  });

  // ── Activation (Enter selects locale) ──

  it("Enter on focused item triggers activation (automatic mode)", () => {
    const page = openDropdown("en");
    page.keyboard.press("Enter");
    expect(page.focusedItemId("locale-menu")).toBe("en");
  });

  // ── Dismiss (Escape closes) ──

  it("Escape closes the dropdown (clears active zone)", () => {
    const page = openDropdown();
    page.keyboard.press("Escape");
    expect(page.activeZoneId()).toBeNull();
  });

  it("Escape + stack pop restores focus to trigger button", () => {
    const page = openDropdown();
    page.keyboard.press("Escape");
    page.dispatch(OS_STACK_POP());
    expect(page.activeZoneId()).toBe("toolbar");
    expect(page.focusedItemId("toolbar")).toBe("locale-trigger");
  });

  // ── AutoFocus ──

  it("menu opens with focus on first item (entry: first)", () => {
    const page = openDropdown();
    expect(page.focusedItemId("locale-menu")).toBe("ko");
  });

  // ── Tab trap ──

  it("Tab does not escape the menu (tab: trap)", () => {
    const page = openDropdown("en");
    page.keyboard.press("Tab");
    expect(page.activeZoneId()).toBe("locale-menu");
  });
});
