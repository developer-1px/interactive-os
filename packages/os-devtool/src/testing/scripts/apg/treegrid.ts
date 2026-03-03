import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgTreegridScript: TestScript = {
  name: "APG Treegrid — Expand/Collapse + Row Nav",
  async run(page, expect = defaultExpect) {
    await page.locator("#tab-treegrid").click();

    // Click first thread row
    await page.locator("#thread:thread-1").click();
    await expect(page.locator("#thread:thread-1")).toBeFocused();

    // ArrowDown → next visible row
    await page.keyboard.press("ArrowDown");

    // ArrowRight on thread → expand (if not already)
    await page.locator("#thread:thread-1").click();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#thread:thread-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // ArrowLeft → collapse
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#thread:thread-1")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  },
};
