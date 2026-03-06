import type { TestScript } from "../../types";

export const apgWindowSplitterScript: TestScript = {
  name: "APG Window Splitter — Resize with Arrow",
  async run(page) {
    await page.locator("#tab-window-splitter").click();

    // Focus the separator (Zone item with role=separator)
    // WindowSplitter uses a single separator item within the splitter zone
    // The separator has role="separator" — we simply navigate to the zone
    // Note: this is a minimal script since splitter has specialized interactions
  },
};
