import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgSpinbuttonScript: TestScript = {
  name: "APG Spinbutton — Arrow Increment/Decrement",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-spinbutton").click();

    // Click hours spinner
    await page.locator("#spin-hours").click();
    await expect(page.locator("#spin-hours")).toBeFocused();

    // ArrowDown → navigate to next spinner
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#spin-minutes")).toBeFocused();

    // ArrowDown → navigate to duration
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#spin-duration")).toBeFocused();

    // Home → back to first
    await page.keyboard.press("Home");
    await expect(page.locator("#spin-hours")).toBeFocused();
  },
};
