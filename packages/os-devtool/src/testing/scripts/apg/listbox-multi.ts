import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgListboxMultiScript: TestScript = {
  name: "APG Listbox Multi — Toggle + Range",
  async run(page, expect = defaultExpect) {
    // Navigate to Listbox pattern via sidebar
    await page.locator("#tab-listbox").click();

    // Click focuses AND selects (OS_SELECT mode:replace)
    await page.locator("#m-opt-Apple").click();
    await expect(page.locator("#m-opt-Apple")).toBeFocused();
    await expect(page.locator("#m-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Space toggles selection OFF (already selected by click)
    await page.keyboard.press(" ");
    await expect(page.locator("#m-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Space again toggles it back ON
    await page.keyboard.press(" ");
    await expect(page.locator("#m-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // ArrowDown moves focus, does NOT auto-select (multi: followFocus=false)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#m-opt-Banana")).toBeFocused();
    await expect(page.locator("#m-opt-Banana")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Space toggles banana ON
    await page.keyboard.press(" ");
    await expect(page.locator("#m-opt-Banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // Apple still selected
    await expect(page.locator("#m-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};
