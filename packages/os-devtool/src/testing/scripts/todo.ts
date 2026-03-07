/**
 * Todo App — Write-Once TestScripts
 *
 * Single scripts that run identically in 3 environments:
 *   1. Headless (vitest) — page = createPage(TodoApp, TodoPage)
 *   2. Browser  (TestBot) — page = browserPage
 *   3. Playwright E2E     — page = createPlaywrightPage(playwrightPage)
 *
 * Only Playwright-subset API: locator(), click(), keyboard.press/type,
 * expect().toBeFocused(), expect().toHaveAttribute().
 */

import { expect as defaultExpect } from "../expect";
import type { TestScript } from "../types";

// ═══════════════════════════════════════════════════════════════════
// §1 List Zone — Navigation
// ═══════════════════════════════════════════════════════════════════

export const todoNavigationScript: TestScript = {
  name: "Todo §1 — List Navigation",
  async run(page, expect = defaultExpect) {
    // Click focuses item
    await page.locator("#todo_1").click();
    await expect(page.locator("#todo_1")).toBeFocused();

    // ArrowDown moves focus
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#todo_2")).toBeFocused();

    // ArrowUp moves focus back
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#todo_1")).toBeFocused();

    // Home moves to first
    await page.locator("#todo_3").click();
    await page.keyboard.press("Home");
    await expect(page.locator("#todo_1")).toBeFocused();

    // End moves to last
    await page.keyboard.press("End");
    await expect(page.locator("#todo_4")).toBeFocused();

    // Boundary clamp at bottom
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#todo_4")).toBeFocused();

    // Boundary clamp at top
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#todo_1")).toBeFocused();
  },
};

// ═══════════════════════════════════════════════════════════════════
// §2 List Zone — Selection
// ═══════════════════════════════════════════════════════════════════

export const todoSelectionScript: TestScript = {
  name: "Todo §2 — List Selection",
  async run(page, expect = defaultExpect) {
    // Click selects item
    await page.locator("#todo_1").click();
    await expect(page.locator("#todo_1")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Shift+ArrowDown extends selection
    await page.keyboard.press("Shift+ArrowDown");
    await expect(page.locator("#todo_1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#todo_2")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Escape deselects all
    await page.keyboard.press("Escape");
    await expect(page.locator("#todo_1")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#todo_2")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  },
};

// ═══════════════════════════════════════════════════════════════════
// §3 Sidebar Zone — Category Navigation
// ═══════════════════════════════════════════════════════════════════

export const todoSidebarScript: TestScript = {
  name: "Todo §3 — Sidebar Navigation",
  async run(page, expect = defaultExpect) {
    // Click focuses and selects category (followFocus)
    await page.locator("#cat_inbox").click();
    await expect(page.locator("#cat_inbox")).toBeFocused();
    await expect(page.locator("#cat_inbox")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // ArrowDown moves focus with followFocus selection
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cat_work")).toBeFocused();
    await expect(page.locator("#cat_work")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cat_inbox")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // ArrowUp moves focus backwards
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cat_inbox")).toBeFocused();
  },
};

// ═══════════════════════════════════════════════════════════════════
// All Scripts — convenience export for runners
// ═══════════════════════════════════════════════════════════════════

export const todoScripts: TestScript[] = [
  todoNavigationScript,
  todoSelectionScript,
  todoSidebarScript,
];
