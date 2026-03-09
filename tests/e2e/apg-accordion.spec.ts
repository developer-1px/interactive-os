/**
 * "Write once, run anywhere" Engine 3 proof.
 *
 * Import existing TestScript from apg/accordion.ts,
 * pass native Playwright page + expect. Zero new test logic.
 */

import { expect, test } from "@playwright/test";
import { apgAccordionScript } from "../../packages/os-devtool/src/testing/scripts/apg/accordion";

test(apgAccordionScript.name, async ({ page }) => {
  await page.goto("/playground/apg/accordion");
  // Dismiss any overlay that might intercept clicks
  await page.keyboard.press("Escape");
  await page.locator("#acc-personal").waitFor({ state: "visible" });
  await apgAccordionScript.run(page, expect);
});
