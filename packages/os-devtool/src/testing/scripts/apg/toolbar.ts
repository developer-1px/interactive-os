import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgToolbarScript: TestScript = {
  name: "APG Toolbar — Horizontal Loop",
  async run(page, expect = defaultExpect) {
    // Navigate to Toolbar pattern via sidebar
    await page.locator("#tab-toolbar").click();

    // Click first tool
    await page.locator("#tool-bold").click();
    await expect(page.locator("#tool-bold")).toBeFocused();

    // ArrowRight navigates
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-italic")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-underline")).toBeFocused();

    // ArrowDown: no effect (horizontal toolbar)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tool-underline")).toBeFocused();
  },
};
