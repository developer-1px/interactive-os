/**
 * Todo — TestBot Scripts (Unified: Headless + Browser + E2E)
 *
 * "Write once, run anywhere":
 *   1. vitest headless — auto-runner reads `scenarios` export
 *   2. browser visual  — TestBot reads via manifest
 *   3. Playwright E2E  — native page
 *
 * Locator convention: always use "#id" selector (Playwright-compatible).
 */

import type { TestScenario, TestScript } from "@os-devtool/testing";
import { OS_CHECK } from "@os-sdk/os";

// ═══════════════════════════════════════════════════════════════════
// Auto-discovery metadata — testbot-manifest.ts reads these eagerly
// ═══════════════════════════════════════════════════════════════════

/** Zone IDs that trigger this file's scripts */
export const zones = ["list", "sidebar"];
/** UI group name */
export const group = "Todo";

// ═══════════════════════════════════════════════════════════════════
// Zone metadata — shared by scenarios and TestBot manifest
// ═══════════════════════════════════════════════════════════════════

export const LIST_ITEMS = ["todo_1", "todo_2", "todo_3", "todo_4"];
export const SIDEBAR_ITEMS = ["cat_inbox", "cat_work", "cat_personal"];

// ═══════════════════════════════════════════════════════════════════
// §1 List Zone — navigation + selection + check
// ═══════════════════════════════════════════════════════════════════

export const listNavScripts: TestScript[] = [
  {
    name: "§1a List: click focuses item",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[0]!}`).click();
      await expect(page.locator(`#${LIST_ITEMS[0]!}`)).toBeFocused();
    },
  },
  {
    name: "§1b List: ArrowDown moves focus",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[0]!}`).click();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator(`#${LIST_ITEMS[1]!}`)).toBeFocused();
    },
  },
  {
    name: "§1c List: ArrowUp moves focus",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[1]!}`).click();
      await page.keyboard.press("ArrowUp");
      await expect(page.locator(`#${LIST_ITEMS[0]!}`)).toBeFocused();
    },
  },
  {
    name: "§1d List: Home moves to first",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[2]!}`).click();
      await page.keyboard.press("Home");
      await expect(page.locator(`#${LIST_ITEMS[0]!}`)).toBeFocused();
    },
  },
  {
    name: "§1e List: End moves to last",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[0]!}`).click();
      await page.keyboard.press("End");
      await expect(page.locator(`#${LIST_ITEMS[3]!}`)).toBeFocused();
    },
  },
  {
    name: "§1f List: Space toggles checked",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[0]!}`).click();
      await expect(page.locator(`#${LIST_ITEMS[0]!}`)).not.toBeChecked();
      await page.keyboard.press("Space");
      await expect(page.locator(`#${LIST_ITEMS[0]!}`)).toBeChecked();
    },
  },
  {
    name: "§1g List: Shift+ArrowDown extends selection",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[0]!}`).click();
      await page.keyboard.press("Shift+ArrowDown");
      await expect(page.locator(`#${LIST_ITEMS[1]!}`)).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §3 Trigger Click — per-button dispatch via page.locator("#trigger-id").click()
//
// Requires full app context (triggers registered via zone.trigger()).
// Runs in: browser TestBot ✓, createHeadlessPage(TodoApp) ✓
// Does NOT run via runScenarios (no app triggers in generic scenarios).
// ═══════════════════════════════════════════════════════════════════

export const triggerClickScripts: TestScript[] = [
  {
    name: "§3a Trigger: start-edit preserves focus",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[0]!}`).click();
      await page.locator("#start-edit").click();
      await expect(page.locator(`#${LIST_ITEMS[0]!}`)).toBeFocused();
    },
  },
  {
    name: "§3b Trigger: move-item-down reorders",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[0]!}`).click();
      await page.locator("#move-item-down").click();
      // After moving todo_1 down, todo_2 is now first → Home lands on todo_2
      await page.keyboard.press("Home");
      await expect(page.locator(`#${LIST_ITEMS[1]!}`)).toBeFocused();
    },
  },
  {
    name: "§3c Trigger: move-item-up reorders",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[1]!}`).click();
      await page.locator("#move-item-up").click();
      // After moving todo_2 up, todo_2 is now first → Home lands on todo_2
      await page.keyboard.press("Home");
      await expect(page.locator(`#${LIST_ITEMS[1]!}`)).toBeFocused();
    },
  },
  {
    name: "§3d Trigger: delete-todo removes focused item",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[0]!}`).click();
      await page.locator("#delete-todo").click();
      // After delete, focus should move to next item
      await expect(page.locator(`#${LIST_ITEMS[1]!}`)).toBeFocused();
    },
  },
  {
    name: "§3e Trigger: toggle-todo checks item",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${LIST_ITEMS[0]!}`).click();
      await expect(page.locator(`#${LIST_ITEMS[0]!}`)).not.toBeChecked();
      await page.locator("#toggle-todo").click();
      await expect(page.locator(`#${LIST_ITEMS[0]!}`)).toBeChecked();
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §2 Sidebar Zone — category navigation + selection
// ═══════════════════════════════════════════════════════════════════

export const sidebarScripts: TestScript[] = [
  {
    name: "§2a Sidebar: click focuses category",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${SIDEBAR_ITEMS[0]!}`).click();
      await expect(page.locator(`#${SIDEBAR_ITEMS[0]!}`)).toBeFocused();
    },
  },
  {
    name: "§2b Sidebar: ArrowDown moves focus",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${SIDEBAR_ITEMS[0]!}`).click();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator(`#${SIDEBAR_ITEMS[1]!}`)).toBeFocused();
    },
  },
  {
    name: "§2c Sidebar: ArrowUp moves focus",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${SIDEBAR_ITEMS[1]!}`).click();
      await page.keyboard.press("ArrowUp");
      await expect(page.locator(`#${SIDEBAR_ITEMS[0]!}`)).toBeFocused();
    },
  },
  {
    name: "§2d Sidebar: followFocus selects on navigate",
    group: "Todo",
    async run(page, expect) {
      await page.locator(`#${SIDEBAR_ITEMS[0]!}`).click();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator(`#${SIDEBAR_ITEMS[1]!}`)).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// Scenarios — auto-runner reads this for vitest auto-registration
// ═══════════════════════════════════════════════════════════════════

export const scenarios: TestScenario[] = [
  {
    zone: "list",
    items: LIST_ITEMS,
    role: "listbox",
    config: {
      dismiss: { escape: "deselect", outsideClick: "none" },
      select: {
        mode: "multiple",
        range: true,
        toggle: true,
        followFocus: false,
        disallowEmpty: false,
      },
      inputmap: { Space: [OS_CHECK()] },
    },
    scripts: listNavScripts,
  },
  {
    zone: "sidebar",
    items: SIDEBAR_ITEMS,
    role: "listbox",
    config: {
      select: {
        mode: "single",
        followFocus: true,
        disallowEmpty: false,
        range: false,
        toggle: false,
      },
    },
    scripts: sidebarScripts,
  },
];

// ═══════════════════════════════════════════════════════════════════
// All scripts — for TestBot manifest
// ═══════════════════════════════════════════════════════════════════

export const allScripts: TestScript[] = [
  ...listNavScripts,
  ...triggerClickScripts,
  ...sidebarScripts,
];
