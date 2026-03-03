import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgSliderMultiThumbScript: TestScript = {
  name: "APG Slider Multi — Dual Thumb",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-slider-multithumb").click();

    // Click min thumb → focus
    await page.locator("#thumb-min-price").click();
    await expect(page.locator("#thumb-min-price")).toBeFocused();

    // ArrowRight → increment min value
    await page.keyboard.press("ArrowRight");
    // Focus stays on min thumb
    await expect(page.locator("#thumb-min-price")).toBeFocused();

    // Click max thumb → focus
    await page.locator("#thumb-max-price").click();
    await expect(page.locator("#thumb-max-price")).toBeFocused();

    // ArrowLeft → decrement max value
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#thumb-max-price")).toBeFocused();
  },
};
