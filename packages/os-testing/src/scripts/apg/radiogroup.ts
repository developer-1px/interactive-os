import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgRadiogroupScript: TestScript = {
  name: "APG RadioGroup — Arrow Nav + Check",
  async run(page, expect = defaultExpect) {
    // Navigate to RadioGroup pattern via sidebar
    await page.locator("#tab-radiogroup").click();

    // ═══ Click to check ═══
    await page.locator("#radio-regular").click();
    await expect(page.locator("#radio-regular")).toBeFocused();
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ═══ ArrowDown: moves focus + checks next ═══
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-deep")).toBeFocused();
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    // Previous unchecked
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    // ═══ ArrowRight: also moves focus + checks (linear-both) ═══
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#radio-thin")).toBeFocused();
    await expect(page.locator("#radio-thin")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ═══ ArrowDown at last: loop to first ═══
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-regular")).toBeFocused();
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ═══ ArrowUp at first: loop to last ═══
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#radio-thin")).toBeFocused();
    await expect(page.locator("#radio-thin")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ═══ ArrowLeft: also moves focus + checks ═══
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#radio-deep")).toBeFocused();
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  },
};
