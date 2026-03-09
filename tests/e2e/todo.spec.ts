/**
 * Todo App — E2E proof of Zero Drift.
 *
 * Same TestScripts from testbot-todo.ts, run with native Playwright page.
 * If headless PASS = E2E PASS, Zero Drift is empirically proven.
 */

import "./vite-polyfill";
import { scenarios } from "@apps/todo/testbot-todo";
import { expect, test } from "@playwright/test";

for (const scenario of scenarios) {
  test.describe(`${scenario.role} — ${scenario.zone}`, () => {
    for (const script of scenario.scripts) {
      test(script.name, async ({ page }) => {
        await page.goto("/todo");
        // Wait for the zone to be rendered
        await page
          .locator(`[data-zone="${scenario.zone}"]`)
          .waitFor({ state: "visible" });
        // Discover items from real DOM (same as ZoneRegistry in headless)
        const items = await page
          .locator(`[data-zone="${scenario.zone}"] [data-item]`)
          .evaluateAll((els) => els.map((el) => el.id));
        await script.run(page, expect, items);
      });
    }
  });
}
