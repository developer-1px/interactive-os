import { expect, test } from "@playwright/test";
import type { Page as PlaywrightPage } from "@playwright/test";
import { apgShowcaseScripts, type TestScript } from "../../os/testing/scripts";
import type { Page } from "../../os/testing/types";

/**
 * APG TestBot E2E — Playwright runner for TestBot scripts.
 *
 * "Write once, run anywhere":
 *   - Headless (vitest): run(headlessPage, ourExpect)
 *   - Browser (TestBot): run(browserPage, ourExpect)
 *   - Playwright E2E:    run(playwrightPage, playwrightExpect)  ← this file
 *
 * Bridge: createPlaywrightPage() adapts Playwright's page to match
 * the OS locator convention (data-item-id → CSS selector).
 */

// ─── Script → URL mapping ───
// Each script navigates via sidebar click (#tab-xxx), but we also need
// to start on the APG showcase page.
const PATTERN_URLS: Record<string, string> = {
    listbox: "/playground/apg/listbox",
    tabs: "/playground/apg/tabs",
    tree: "/playground/apg/tree",
    toolbar: "/playground/apg/toolbar",
    accordion: "/playground/apg/accordion",
    menu: "/playground/apg/menu",
    grid: "/playground/apg/grid",
    switch: "/playground/apg/switch",
    slider: "/playground/apg/slider",
    radiogroup: "/playground/apg/radiogroup",
};

/**
 * Adapt Playwright Page to OS TestBot Page interface.
 *
 * Key difference: OS items use `data-item-id` attribute, not native `id`.
 * Browser TestBot's findEl() resolves `id` → `[data-item-id="id"] | #id | [data-zone="id"]`.
 * This adapter applies the same fallback: `#xxx` → `[data-item-id="xxx"], [id="xxx"]`.
 */
function createPlaywrightPage(page: PlaywrightPage): Page {
    return {
        locator(selector: string) {
            if (selector.startsWith("#")) {
                const id = selector.slice(1);
                // Same priority as findEl(): data-item-id first, then native id, then data-zone
                return page.locator(
                    `[data-item-id="${id}"], [id="${id}"], [data-zone="${id}"]`,
                ).first();
            }
            return page.locator(selector);
        },
        keyboard: page.keyboard,
    };
}

// ─── Tests ───

test.describe("APG TestBot E2E", () => {
    for (const script of apgShowcaseScripts) {
        test(script.name, async ({ page }) => {
            // Navigate directly to the pattern page
            const patternKey = guessPatternKey(script);
            const url = PATTERN_URLS[patternKey] || "/playground/apg";

            await page.goto(url);
            await page.waitForLoadState("networkidle");

            // Wait for React mount
            await page.waitForSelector("[data-zone]", { timeout: 10000 });

            const adapted = createPlaywrightPage(page);
            await script.run(adapted, expect);
        });
    }
});

/**
 * Extract pattern key from script name or first sidebar click.
 * Script names follow "APG Xxx — ..." or "APG Xxx Yyy — ..." pattern.
 */
function guessPatternKey(script: TestScript): string {
    // Match the sidebar tab ID from the script's run function source
    const name = script.name.toLowerCase();
    for (const key of Object.keys(PATTERN_URLS)) {
        if (name.includes(key)) return key;
    }
    return "listbox"; // fallback
}
