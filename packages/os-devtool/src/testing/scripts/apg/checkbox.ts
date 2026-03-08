import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgCheckboxScript: TestScript = {
  name: "APG Checkbox — Space Toggle",
  async run(page, expect = defaultExpect) {
    // Navigate to Checkbox pattern via sidebar
    await page.locator("#tab-checkbox").click();

    // Click to focus and check (OS_ACTIVATE → onAction → OS_CHECK)
    await page.locator("#cond-lettuce").click();
    await expect(page.locator("#cond-lettuce")).toBeFocused();
    await expect(page.locator("#cond-lettuce")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // Space to toggle off
    await page.keyboard.press(" ");
    await expect(page.locator("#cond-lettuce")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    // Enter does NOT toggle checkbox (W3C APG: Space only)

    // Arrow down to next
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cond-tomato")).toBeFocused();
    await expect(page.locator("#cond-tomato")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    // Space to toggle on
    await page.keyboard.press(" ");
    await expect(page.locator("#cond-tomato")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  },
};
