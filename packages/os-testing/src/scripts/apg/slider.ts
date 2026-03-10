import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgSliderScript: TestScript = {
  name: "APG Slider — Arrow + Home/End",
  async run(page, expect = defaultExpect) {
    // Navigate to Slider pattern via sidebar
    await page.locator("#tab-slider").click();

    // Click Red slider to focus
    await page.locator("#slider-red").click();
    await expect(page.locator("#slider-red")).toBeFocused();

    // Home → min value (0) — known start point
    await page.keyboard.press("Home");
    await expect(page.locator("#slider-red")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );

    // ArrowRight → value increases to 1
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#slider-red")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );

    // End → max value (100 — slider role preset default)
    await page.keyboard.press("End");
    await expect(page.locator("#slider-red")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );

    // ArrowLeft from max → 99
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#slider-red")).toHaveAttribute(
      "aria-valuenow",
      "99",
    );
  },
};
