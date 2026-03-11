/**
 * DocsViewer — E2E proof of Zero Drift.
 *
 * Same TestScripts from testbot-docs.ts, run with native Playwright page.
 * If headless PASS = E2E PASS, Zero Drift is empirically proven.
 */

import { expect, test } from "@playwright/test";
import { scenarios } from "@/docs-viewer/testbot-docs";

for (const scenario of scenarios) {
  test.describe(`${scenario.role} — ${scenario.zone}`, () => {
    for (const script of scenario.scripts) {
      test(script.name, async ({ page }) => {
        await page.goto("/docs");
        // Wait for the zone to be rendered
        await page
          .locator(`[data-zone="${scenario.zone}"]`)
          .waitFor({ state: "visible" });
        await script.run(page, expect);
      });
    }
  });
}
