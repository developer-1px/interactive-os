import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgCarouselScript: TestScript = {
  name: "APG Carousel — Tab Nav + Slide Display",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-carousel").click();

    // Click first carousel tab → select
    await page.locator("#slide-1").click();
    await expect(page.locator("#slide-1")).toBeFocused();
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // ArrowRight → next tab + select
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#slide-2")).toBeFocused();
    await expect(page.locator("#slide-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  },
};
