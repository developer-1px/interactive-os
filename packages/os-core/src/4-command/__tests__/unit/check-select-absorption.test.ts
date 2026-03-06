/**
 * @spec docs/1-project/command-config-invariant/spec.md §1.4 (T4)
 *
 * T4: CHECK via OS_CHECK — input-based tests
 * keyboard.press("Space") triggers the full pipeline:
 *   key → resolveItemKey → OS_CHECK → selection toggle → aria-checked
 *
 * checkbox/switch use select.mode="none" + check.mode="check".
 * OS_CHECK directly toggles z.selection, which projects as aria-checked.
 * select.mode="none" prevents mousedown from interfering with the toggle.
 */

import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { createHeadlessPage } from "@os-devtool/testing/createHeadlessPage";
import { afterEach, describe, expect, it } from "vitest";

describe("T4: CHECK (input-based)", () => {
  const page = createHeadlessPage();
  afterEach(() => page.cleanup());

  describe("checkbox/switch preset config (inputmap)", () => {
    it("checkbox: select.mode = 'none', inputmap has OS_CHECK", () => {
      const config = resolveRole("checkbox");
      expect(config.select.mode).toBe("none");
      expect(config.inputmap["Space"]).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
      );
    });

    it("switch: select.mode = 'none', inputmap has OS_CHECK", () => {
      const config = resolveRole("switch");
      expect(config.select.mode).toBe("none");
      expect(config.inputmap["Space"]).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
      );
    });
  });

  describe("checkbox: Space toggles checked state", () => {
    it("Space on unchecked → checks", async () => {
      page.goto("cb-zone", {
        role: "checkbox",
        items: ["cb-1"],
        focusedItemId: "cb-1",
      });

      await page.keyboard.press("Space");
      await page.locator("#cb-1").toHaveAttribute("aria-checked", "true");
    });

    it("Space on checked → unchecks", async () => {
      page.goto("cb-zone", {
        role: "checkbox",
        items: ["cb-1"],
        focusedItemId: "cb-1",
        initial: { selection: ["cb-1"] },
      });

      await page.locator("#cb-1").toHaveAttribute("aria-checked", "true");
      await page.keyboard.press("Space");
      await page.locator("#cb-1").toHaveAttribute("aria-checked", "false");
    });
  });
});
