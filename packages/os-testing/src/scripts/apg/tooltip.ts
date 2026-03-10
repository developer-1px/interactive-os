import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgTooltipScript: TestScript = {
  name: "APG Tooltip — Toolbar Nav + data-focused",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-tooltip").click();

    // Click first button → focus (tooltip appears via CSS)
    await page.locator("#btn-cut").click();
    await expect(page.locator("#btn-cut")).toBeFocused();

    // ArrowRight → next button (tooltip moves)
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#btn-copy")).toBeFocused();

    // ArrowRight → continue
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#btn-paste")).toBeFocused();
  },
};
