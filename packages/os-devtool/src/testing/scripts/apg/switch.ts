import { expect as defaultExpect } from "../../expect";
import type { TestScript } from "../../types";

export const apgSwitchScript: TestScript = {
  name: "APG Switch — Toggle On/Off",
  async run(page, expect = defaultExpect) {
    // Navigate to Switch pattern via sidebar
    await page.locator("#tab-switch").click();

    // ═══ Click toggle ═══

    // Click notifications switch (initially off)
    await page.locator("#switch-notifications").click();
    await expect(page.locator("#switch-notifications")).toBeFocused();
    await expect(page.locator("#switch-notifications")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // Click again → toggle off
    await page.locator("#switch-notifications").click();
    await expect(page.locator("#switch-notifications")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    // ═══ Space toggle ═══

    // Space to toggle on
    await page.keyboard.press(" ");
    await expect(page.locator("#switch-notifications")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ═══ Enter toggle ═══

    // Enter to toggle off
    await page.keyboard.press("Enter");
    await expect(page.locator("#switch-notifications")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    // ═══ Multiple switches independence ═══

    // Dark mode switch — click toggles independently
    await page.locator("#switch-dark-mode").click();
    await expect(page.locator("#switch-dark-mode")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    // Notifications still off
    await expect(page.locator("#switch-notifications")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  },
};
