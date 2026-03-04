import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgButtonScript: TestScript = {
  name: "APG Button — Toggle aria-pressed",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-button").click();

    // Click toggle bold → focus + toggle pressed
    await page.locator("#toggle-bold").click();
    await expect(page.locator("#toggle-bold")).toBeFocused();
    await expect(page.locator("#toggle-bold")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Space to toggle off
    await page.keyboard.press(" ");
    await expect(page.locator("#toggle-bold")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  },
};
