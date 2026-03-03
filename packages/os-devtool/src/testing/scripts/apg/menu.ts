import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgMenuScript: TestScript = {
  name: "APG Menu — Menubar + Dropdown + Checkbox",
  async run(page, expect = defaultExpect) {
    // Navigate to Menu pattern via sidebar
    await page.locator("#tab-menu").click();

    // ═══ Menubar: horizontal navigation ═══

    // Click first menubar item
    await page.locator("#mb-file").click();
    await expect(page.locator("#mb-file")).toBeFocused();

    // ArrowRight → next
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#mb-edit")).toBeFocused();

    // ArrowRight → last
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#mb-view")).toBeFocused();

    // Loop: ArrowRight at last → wraps to first
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#mb-file")).toBeFocused();

    // Loop: ArrowLeft at first → wraps to last
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#mb-view")).toBeFocused();

    // ═══ Dropdown menu: vertical navigation ═══

    // Click first menu item in the dropdown
    await page.locator("#cmd-new").click();
    await expect(page.locator("#cmd-new")).toBeFocused();

    // ArrowDown → next
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cmd-open")).toBeFocused();

    // Continue down through checkboxes
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#check-ruler")).toBeFocused();

    // Home → first
    await page.keyboard.press("Home");
    await expect(page.locator("#cmd-new")).toBeFocused();

    // End → last
    await page.keyboard.press("End");
    await expect(page.locator("#radio-right")).toBeFocused();

    // ═══ Checkbox: aria-checked toggle ═══

    // Navigate to check-ruler
    await page.locator("#check-ruler").click();
    await expect(page.locator("#check-ruler")).toBeFocused();

    // Verify initial state from JSX (ruler starts checked via useState)
    // After click, the onAction callback toggles the checked state
    const rulerChecked = await page
      .locator("#check-ruler")
      .getAttribute("aria-checked");

    // Toggle: if currently checked, Space unchecks; if not, Space checks
    await page.keyboard.press(" ");
    // aria-checked should have flipped
    if (rulerChecked === "true") {
      await expect(page.locator("#check-ruler")).toHaveAttribute(
        "aria-checked",
        "false",
      );
    } else {
      await expect(page.locator("#check-ruler")).toHaveAttribute(
        "aria-checked",
        "true",
      );
    }
  },
};
