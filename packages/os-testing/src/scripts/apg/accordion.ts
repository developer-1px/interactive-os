import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgAccordionScript: TestScript = {
  name: "APG Accordion — Click Expand + Arrow Nav",
  async run(page, expect = defaultExpect) {
    // Navigate to Accordion pattern via sidebar
    await page.locator("#tab-accordion").click();

    // Click first header → focus + expand
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toBeFocused();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Click again → collapse
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // ArrowDown moves to next header
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#acc-billing")).toBeFocused();

    // Home → first
    await page.keyboard.press("Home");
    await expect(page.locator("#acc-personal")).toBeFocused();

    // End → last
    await page.keyboard.press("End");
    await expect(page.locator("#acc-shipping")).toBeFocused();
  },
};
