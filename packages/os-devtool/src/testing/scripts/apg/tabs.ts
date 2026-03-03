import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgTabsAutoScript: TestScript = {
  name: "APG Tabs (Auto) — ArrowRight + followFocus",
  async run(page, expect = defaultExpect) {
    // Navigate to Tabs pattern via sidebar
    await page.locator("#tab-tabs").click();

    // Click first tab
    await page.locator("#tab-ahlefeldt").click();
    await expect(page.locator("#tab-ahlefeldt")).toBeFocused();
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // ArrowRight → next tab, auto-select
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-andersen")).toBeFocused();
    await expect(page.locator("#tab-andersen")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // ArrowRight to third tab
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-fonseca")).toBeFocused();

    // Loop: ArrowRight at last wraps to first
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-ahlefeldt")).toBeFocused();
  },
};
