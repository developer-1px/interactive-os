import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgTreeScript: TestScript = {
  name: "APG Tree — Expand/Collapse + Nav",
  async run(page, expect = defaultExpect) {
    // Navigate to Tree pattern via sidebar
    await page.locator("#tab-tree").click();

    // Click src folder
    await page.locator("#folder:src").click();
    await expect(page.locator("#folder:src")).toBeFocused();

    // ArrowRight expands src folder (starts collapsed)
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#folder:src")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // ArrowDown enters children (src/components)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#folder:src/components")).toBeFocused();

    // ArrowLeft collapses back to parent (src)
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#folder:src")).toBeFocused();
  },
};
