import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgDisclosureScript: TestScript = {
  name: "APG Disclosure — Expand/Collapse FAQ",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-disclosure").click();

    // Click toggles disclosure (click is in inputmap → focus + expand)
    await page.locator("#disc-faq-1").click();
    await expect(page.locator("#disc-faq-1")).toBeFocused();
    await expect(page.locator("#disc-faq-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Enter → collapse (second toggle)
    await page.keyboard.press("Enter");
    await expect(page.locator("#disc-faq-1")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Enter → expand again
    await page.keyboard.press("Enter");
    await expect(page.locator("#disc-faq-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // ArrowDown → next disclosure
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#disc-faq-2")).toBeFocused();
  },
};
