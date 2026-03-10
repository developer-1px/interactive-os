import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgFeedScript: TestScript = {
  name: "APG Feed — Vertical Nav (no loop)",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-feed").click();

    await page.locator("#article-1").click();
    await expect(page.locator("#article-1")).toBeFocused();

    // ArrowDown → next article
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#article-2")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#article-3")).toBeFocused();

    // Home → first
    await page.keyboard.press("Home");
    await expect(page.locator("#article-1")).toBeFocused();

    // End → last
    await page.keyboard.press("End");
    await expect(page.locator("#article-5")).toBeFocused();

    // ArrowDown at last → clamp (no loop)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#article-5")).toBeFocused();
  },
};
