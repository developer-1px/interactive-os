import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgListboxSingleScript: TestScript = {
  name: "APG Listbox Single — followFocus + Negative",
  async run(page, expect = defaultExpect) {
    // Navigate to Listbox pattern via sidebar
    await page.locator("#tab-listbox").click();

    // Click focuses + selects (followFocus)
    await page.locator("#s-opt-Apple").click();
    await expect(page.locator("#s-opt-Apple")).toBeFocused();
    await expect(page.locator("#s-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // ArrowDown → selection follows focus
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#s-opt-Banana")).toBeFocused();
    await expect(page.locator("#s-opt-Banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#s-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Boundary clamp at bottom
    await page.keyboard.press("End");
    await expect(page.locator("#s-opt-Honeydew")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#s-opt-Honeydew")).toBeFocused();

    // Home
    await page.keyboard.press("Home");
    await expect(page.locator("#s-opt-Apple")).toBeFocused();

    // NEGATIVE: Shift+ArrowDown MUST NOT create range (single-select)
    await page.keyboard.press("Shift+ArrowDown");
    await expect(page.locator("#s-opt-Banana")).toBeFocused();
    await expect(page.locator("#s-opt-Banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#s-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // NEGATIVE: Shift+Click MUST NOT create range (single-select)
    await page.locator("#s-opt-Apple").click(); // reset to Apple
    await page.locator("#s-opt-Date").click({ modifiers: ["Shift"] });
    // Should replace, not range → only Date selected
    await expect(page.locator("#s-opt-Date")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#s-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#s-opt-Banana")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // NEGATIVE: Cmd+Click MUST NOT toggle (single-select)
    await page.locator("#s-opt-Cherry").click({ modifiers: ["Meta"] });
    // Should replace to Cherry, not toggle/add
    await expect(page.locator("#s-opt-Cherry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#s-opt-Date")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  },
};
