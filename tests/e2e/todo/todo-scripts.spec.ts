/**
 * Todo App — Unified TestScript Runner (Playwright E2E)
 *
 * "Write once, run anywhere":
 *   - Headless (vitest): todo-scripts.test.ts — PASSED ✅
 *   - Playwright E2E:    this file ← same scripts, real browser
 *
 * Bridge: createPlaywrightPage() adapts Playwright's page object to match
 * the OS TestBot Page interface (locator + keyboard).
 */

import { todoScripts } from "@os-devtool/testing/scripts/todo";
import type { Page } from "@os-devtool/testing/types";
import type { Page as PlaywrightPage } from "@playwright/test";
import { expect, test } from "@playwright/test";

/**
 * Adapt Playwright Page to OS TestBot Page interface.
 *
 * OS items use `id` attribute + `data-item` marker.
 * This adapter resolves `#xxx` → `[id="xxx"], [data-zone="xxx"]`.
 */
function createPlaywrightPage(page: PlaywrightPage): Page {
    return {
        locator(selector: string) {
            if (selector.startsWith("#")) {
                const id = selector.slice(1);
                return page.locator(`[id="${id}"], [data-zone="${id}"]`).first();
            }
            return page.locator(selector);
        },
        keyboard: page.keyboard,
    };
}

// ─── Tests ───

test.describe("Todo Unified Scripts (E2E)", () => {
    for (const script of todoScripts) {
        test(script.name, async ({ page }) => {
            // Navigate to Todo app
            await page.goto("/");
            await page.waitForLoadState("networkidle");

            // Wait for React mount — at least one zone must exist
            await page.waitForSelector("[data-zone]", { timeout: 10000 });

            const adapted = createPlaywrightPage(page);
            await script.run(adapted, expect);
        });
    }
});
