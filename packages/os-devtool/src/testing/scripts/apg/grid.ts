import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgGridScript: TestScript = {
  name: "APG Grid — 2D Nav + Multi-Select",
  async run(page, expect = defaultExpect) {
    // Navigate to Grid pattern via sidebar
    await page.locator("#tab-grid").click();

    // ═══ 4-directional navigation ═══

    // Click cell-0 (row 1, col 1)
    await page.locator("#cell-0").click();
    await expect(page.locator("#cell-0")).toBeFocused();

    // ArrowRight → cell-1
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-1")).toBeFocused();

    // ArrowDown → cell-6 (row 2, col 2 in 5-col grid)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-6")).toBeFocused();

    // ArrowLeft → cell-5
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#cell-5")).toBeFocused();

    // ArrowUp → cell-0
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cell-0")).toBeFocused();

    // ═══ Click selection ═══

    await page.locator("#cell-12").click();
    await expect(page.locator("#cell-12")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Cmd+Click adds to selection
    await page.locator("#cell-14").click({ modifiers: ["Meta"] });
    await expect(page.locator("#cell-14")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cell-12")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Cmd+Click toggles off
    await page.locator("#cell-12").click({ modifiers: ["Meta"] });
    await expect(page.locator("#cell-12")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  },
};
