import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgMeterScript: TestScript = {
  name: "APG Meter — Display Values",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-meter").click();

    // Click CPU meter → focus + verify static value attributes
    await page.locator("#meter-cpu").click();
    await expect(page.locator("#meter-cpu")).toBeFocused();
    await expect(page.locator("#meter-cpu")).toHaveAttribute(
      "aria-valuemin",
      "0",
    );
    await expect(page.locator("#meter-cpu")).toHaveAttribute(
      "aria-valuemax",
      "100",
    );
  },
};
