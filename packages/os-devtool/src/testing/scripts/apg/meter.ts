import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgMeterScript: TestScript = {
  name: "APG Meter — Display Values",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-meter").click();

    // Click CPU meter → focus
    await page.locator("#meter-cpu").click();
    await expect(page.locator("#meter-cpu")).toBeFocused();

    // ArrowDown → next meter
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#meter-memory")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#meter-disk")).toBeFocused();
  },
};
