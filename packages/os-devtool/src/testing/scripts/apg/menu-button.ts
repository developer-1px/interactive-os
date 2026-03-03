import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgMenuButtonScript: TestScript = {
  name: "APG Menu Button — Trigger Focus + Nav",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-menu-button").click();

    // Click trigger button → focus
    await page.locator("#mb-actions-trigger").click();
    await expect(page.locator("#mb-actions-trigger")).toBeFocused();

    // Enter opens menu → focus moves to first menu item
    await page.keyboard.press("Enter");
    await expect(page.locator("#action-cut")).toBeFocused();

    // ArrowDown → next menu item
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#action-copy")).toBeFocused();
  },
};
