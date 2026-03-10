import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgSpinbuttonScript: TestScript = {
  name: "APG Spinbutton — Arrow Increment/Decrement",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-spinbutton").click();

    // Click hours spinner
    await page.locator("#spin-hours").click();
    await expect(page.locator("#spin-hours")).toBeFocused();

    // ArrowUp → value increases (spinbutton uses arrows for value, not navigation)
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#spin-hours")).toHaveAttribute(
      "aria-valuenow",
      "10",
    );

    // ArrowDown → value decreases back
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#spin-hours")).toHaveAttribute(
      "aria-valuenow",
      "9",
    );

    // Tab → navigate to next spinner (Tab, not Arrow)
    await page.keyboard.press("Tab");
    await expect(page.locator("#spin-minutes")).toBeFocused();

    // ArrowUp on minutes
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#spin-minutes")).toHaveAttribute(
      "aria-valuenow",
      "31",
    );
  },
};
