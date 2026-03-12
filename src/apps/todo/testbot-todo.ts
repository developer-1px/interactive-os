/**
 * Todo — TestBot Scripts (Unified: Headless + Browser + E2E)
 *
 * "Write once, run anywhere":
 *   1. vitest headless — auto-runner reads `scenarios` export
 *   2. browser visual  — TestBot reads via manifest
 *   3. Playwright E2E  — native page
 *
 * Locator convention: always use "#id" selector (Playwright-compatible).
 * Items are discovered via page.locator('[data-item]').nth(n) — no injection.
 */

import { OS_CHECK } from "@os-sdk/os";
import type { TestScenario, TestScript } from "@os-testing/scripts";

// ═══════════════════════════════════════════════════════════════════
// Auto-discovery metadata — testbot-manifest.ts reads these eagerly
// ═══════════════════════════════════════════════════════════════════

/** Zone IDs that trigger this file's scripts */
export const zones = ["list", "sidebar"];
/** Route path prefix — primary filter key for TestBot panel */
export const route = "/todo";
/** UI group name */
export const group = "Todo";

// ═══════════════════════════════════════════════════════════════════
// §1 List Zone — navigation + selection + check
// ═══════════════════════════════════════════════════════════════════

export const listNavScripts: TestScript[] = [
  {
    name: "§1a List: click focuses item",
    group: "Todo",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();
    },
  },
  {
    name: "§1b List: ArrowDown moves focus",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await page.keyboard.press("ArrowDown");
      await expect(items.nth(1)).toBeFocused();
    },
  },
  {
    name: "§1c List: ArrowUp moves focus",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(1).click();
      await page.keyboard.press("ArrowUp");
      await expect(items.nth(0)).toBeFocused();
    },
  },
  {
    name: "§1d List: Home moves to first",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(2).click();
      await page.keyboard.press("Home");
      await expect(items.nth(0)).toBeFocused();
    },
  },
  {
    name: "§1e List: End moves to last",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await page.keyboard.press("End");
      await expect(items.last()).toBeFocused();
    },
  },
  {
    name: "§1f List: Space toggles checked",
    group: "Todo",
    todo: true, // OS gap: Space→OS_CHECK not dispatching in headless
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).not.toBeChecked();
      await page.keyboard.press("Space");
      await expect(item0).toBeChecked();
    },
  },
  {
    name: "§1g List: Shift+ArrowDown extends selection",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await page.keyboard.press("Shift+ArrowDown");
      await expect(items.nth(1)).toHaveAttribute("aria-selected", "true");
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §3 Trigger Click — per-button dispatch via page.locator("#trigger-id").click()
//
// Requires full app context (triggers registered via bind({ triggers })).
// Runs in: browser TestBot ✓, createPage(TodoApp) ✓
// Does NOT run via runScenarios (no app triggers in generic scenarios).
// ═══════════════════════════════════════════════════════════════════

export const triggerClickScripts: TestScript[] = [
  {
    name: "§3a Trigger: start-edit preserves focus",
    group: "Todo",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      // Trigger locator within the item — uses compound selector
      const itemId = await item0.getAttribute("id");
      await page.locator(`#${itemId} [data-trigger-id="start-edit"]`).click();
      await expect(item0).toBeFocused();
    },
  },
  {
    name: "§3b Trigger: move-item-down reorders",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      const item0 = items.nth(0);
      const item1 = items.nth(1);
      const item0Id = await item0.getAttribute("id");
      await item0.click();
      await page
        .locator(`#${item0Id} [data-trigger-id="move-item-down"]`)
        .click();
      // After moving items[0] down, items[1] is now first → Home lands on item1
      await page.keyboard.press("Home");
      await expect(item1).toBeFocused();
    },
  },
  {
    name: "§3c Trigger: move-item-up reorders",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      const item1 = items.nth(1);
      const item1Id = await item1.getAttribute("id");
      await item1.click();
      await page
        .locator(`#${item1Id} [data-trigger-id="move-item-up"]`)
        .click();
      // After moving items[1] up, items[1] is now first → Home lands on item1
      await page.keyboard.press("Home");
      await expect(item1).toBeFocused();
    },
  },
  {
    name: "§3d Trigger: delete-todo removes focused item",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      const item0Id = await items.nth(0).getAttribute("id");
      await items.nth(0).click();
      await page.locator(`#${item0Id} [data-trigger-id="delete-todo"]`).click();
      // After delete, focus should move to next item
      await expect(items.nth(1)).toBeFocused();
    },
  },
  {
    name: "§3e Trigger: toggle-todo checks item",
    group: "Todo",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      const item0Id = await item0.getAttribute("id");
      await item0.click();
      await expect(item0).not.toBeChecked();
      await page.locator(`#${item0Id} [data-trigger-id="toggle-todo"]`).click();
      await expect(item0).toBeChecked();
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
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();
    },
  },
  {
    name: "§2b Sidebar: ArrowDown moves focus",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await page.keyboard.press("ArrowDown");
      await expect(items.nth(1)).toBeFocused();
    },
  },
  {
    name: "§2c Sidebar: ArrowUp moves focus",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(1).click();
      await page.keyboard.press("ArrowUp");
      await expect(items.nth(0)).toBeFocused();
    },
  },
  {
    name: "§2d Sidebar: followFocus selects on navigate",
    group: "Todo",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await page.keyboard.press("ArrowDown");
      await expect(items.nth(1)).toHaveAttribute("aria-selected", "true");
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// Scenarios — auto-runner reads this for vitest auto-registration
// ═══════════════════════════════════════════════════════════════════

export const scenarios: TestScenario[] = [
  {
    zone: "list",
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
