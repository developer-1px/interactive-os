/**
 * @spec docs/1-project/action-axis-unification/BOARD.md
 *
 * T5+: Accordion expand via action config (v10 declarative)
 * Input-based tests — keyboard.press("Enter"/"Space") triggers the full pipeline:
 *   key → resolveKeyboard → action config → OS_EXPAND (direct)
 *
 * v10: activate.effect path removed. OS_EXPAND is dispatched directly via action axis.
 */

import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { createHeadlessPage } from "@os-devtool/testing/createHeadlessPage";
import { afterEach, describe, expect, it } from "vitest";

describe("T5: EXPAND → NAVIGATE (input-based)", () => {
  const page = createHeadlessPage();
  afterEach(() => page.cleanup());

  it("accordion has inputmap with OS_EXPAND (inputmap declarative)", () => {
    const config = resolveRole("accordion");
    expect(config.inputmap.Space?.[0]?.type).toBe("OS_EXPAND");
    expect(config.inputmap.Enter?.[0]?.type).toBe("OS_EXPAND");
    expect(config.inputmap.click?.[0]?.type).toBe("OS_EXPAND");
  });

  it("Enter on collapsed accordion → expands", async () => {
    page.goto("acc-zone", {
      role: "accordion",
      items: ["header-1", "header-2"],
      focusedItemId: "header-1",
    });

    await page.keyboard.press("Enter");
    await page.locator("#header-1").toHaveAttribute("aria-expanded", "true");
  });

  it("Enter on expanded accordion → collapses", async () => {
    page.goto("acc-zone", {
      role: "accordion",
      items: ["header-1", "header-2"],
      focusedItemId: "header-1",
      initial: { expanded: ["header-1"] },
    });

    await page.locator("#header-1").toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Enter");
    await page.locator("#header-1").toHaveAttribute("aria-expanded", "false");
  });

  it("Space on accordion → also toggles expansion", async () => {
    page.goto("acc-zone", {
      role: "accordion",
      items: ["header-1", "header-2"],
      focusedItemId: "header-1",
    });

    await page.keyboard.press("Space");
    await page.locator("#header-1").toHaveAttribute("aria-expanded", "true");
  });
});
