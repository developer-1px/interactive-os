/**
 * Pit of Success — TestBot Scripts
 *
 * Verifies interactive behavior of the createZone spike
 * through the OS headless pipeline (click → state → assert).
 *
 * §1: Listbox navigation (focus, ArrowDown/Up, Home/End)
 * §2: Trigger clicks (Toggle checked, Delete removes)
 */

import type { TestScenario, TestScript } from "@os-testing/scripts";

// ═══════════════════════════════════════════════════════════════════
// Auto-discovery metadata
// ═══════════════════════════════════════════════════════════════════

export const zones = ["pit-todo-list"];
export const route = "/playground/pit-of-success";
export const group = "Pit of Success Spike";

// ═══════════════════════════════════════════════════════════════════
// §1 Navigation — click + arrow keys
// ═══════════════════════════════════════════════════════════════════

export const navScripts: TestScript[] = [
  {
    name: "§1a click item → focused",
    group: "Pit of Success Spike",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).toBeFocused();
    },
  },
  {
    name: "§1b ArrowDown → next item focused",
    group: "Pit of Success Spike",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(0).click();
      await page.keyboard.press("ArrowDown");
      await expect(items.nth(1)).toBeFocused();
    },
  },
  {
    name: "§1c ArrowUp → previous item focused",
    group: "Pit of Success Spike",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(1).click();
      await page.keyboard.press("ArrowUp");
      await expect(items.nth(0)).toBeFocused();
    },
  },
  {
    name: "§1d Home → first, End → last",
    group: "Pit of Success Spike",
    async run(page, expect) {
      const items = page.locator("[data-item]");
      await items.nth(2).click();
      await page.keyboard.press("Home");
      await expect(items.nth(0)).toBeFocused();
      await page.keyboard.press("End");
      await expect(items.last()).toBeFocused();
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// §2 Triggers — Toggle + Delete
// ═══════════════════════════════════════════════════════════════════

export const triggerScripts: TestScript[] = [
  {
    name: "§2a Toggle → item checked",
    group: "Pit of Success Spike",
    async run(page, expect) {
      const item0 = page.locator("[data-item]").nth(0);
      await item0.click();
      await expect(item0).not.toBeChecked();
      // OS_CHECK triggers toggleTodo via onCheck binding
      await page.keyboard.press("Space");
      await expect(item0).toBeChecked();
    },
  },
  {
    name: "§2b Delete → item removed",
    group: "Pit of Success Spike",
    async run(page, _expect) {
      const items = page.locator("[data-item]");
      const initialCount = await items.count();
      await items.nth(0).click();
      await page.keyboard.press("Delete");
      // One fewer item after delete
      const afterCount = await items.count();
      if (afterCount !== initialCount - 1) {
        throw new Error(
          `Expected ${initialCount - 1} items after delete, got ${afterCount}`,
        );
      }
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// Scenarios
// ═══════════════════════════════════════════════════════════════════

export const scenarios: TestScenario[] = [
  {
    zone: "pit-todo-list",
    role: "listbox",
    scripts: [...navScripts, ...triggerScripts],
  },
];

// ═══════════════════════════════════════════════════════════════════
// All scripts — for TestBot manifest
// ═══════════════════════════════════════════════════════════════════

export const allScripts: TestScript[] = [...navScripts, ...triggerScripts];
