/**
 * resolve-axis — Config-driven key ownership tests
 *
 * Verifies that action.commands[] drives Space/Enter → command mapping
 * WITHOUT role-specific if-branching.
 *
 * @spec docs/1-project/resolve-axis/BOARD.md
 *
 * Key principle: Command type IS the ARIA declaration.
 *   OS_CHECK  → aria-checked
 *   OS_PRESS  → aria-pressed
 *   OS_EXPAND → aria-expanded
 */

import { OS_PRESS } from "@os-core/4-command/activate/press";
import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { createHeadlessPage } from "@os-devtool/testing/createHeadlessPage";
import { afterEach, describe, expect, it } from "vitest";

const page = createHeadlessPage();
afterEach(() => page.cleanup());

// ═══════════════════════════════════════════════════════════════════
// T1+T2: CheckConfig.keys / CheckConfig.onClick in role presets
// ═══════════════════════════════════════════════════════════════════

describe("inputmap in role presets (replaces action.commands)", () => {
  it("checkbox preset has inputmap.Space=[OS_CHECK()]", () => {
    const config = resolveRole("checkbox");
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
  });

  it("switch preset has inputmap Space+Enter+click → OS_CHECK", () => {
    const config = resolveRole("switch");
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    expect(config.inputmap["Enter"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
    expect(config.inputmap["click"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
  });

  it("radiogroup preset has inputmap.Space=[OS_CHECK()]", () => {
    const config = resolveRole("radiogroup");
    expect(config.inputmap["Space"]).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "OS_CHECK" })]),
    );
  });

  it("unknown role has empty inputmap", () => {
    const config = resolveRole("button");
    expect(Object.keys(config.inputmap)).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// T5: Toggle Button — aria-pressed via action.commands = [OS_PRESS()]
//
// Command type IS the ARIA declaration:
//   OS_PRESS → aria-pressed  (no check.aria config needed)
//   OS_CHECK → aria-checked
// ═══════════════════════════════════════════════════════════════════

describe("Toggle Button (aria-pressed) — inputmap with OS_PRESS", () => {
  it("Space → toggles aria-pressed via OS_PRESS command", async () => {
    page.goto("tb-1", {
      role: "toolbar",
      items: ["bold"],
      focusedItemId: "bold",
      config: {
        inputmap: {
          Space: [OS_PRESS()],
          Enter: [OS_PRESS()],
        },
      },
    });

    await page.keyboard.press("Space");
    await page.locator("#bold").toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Space");
    await page.locator("#bold").toHaveAttribute("aria-pressed", "false");
  });

  it("Enter → toggles aria-pressed via OS_PRESS command", async () => {
    page.goto("tb-2", {
      role: "toolbar",
      items: ["italic"],
      focusedItemId: "italic",
      config: {
        inputmap: {
          Space: [OS_PRESS()],
          Enter: [OS_PRESS()],
        },
      },
    });

    await page.keyboard.press("Enter");
    await page.locator("#italic").toHaveAttribute("aria-pressed", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Regression: existing patterns still work
// ═══════════════════════════════════════════════════════════════════

describe("Regression — existing check patterns", () => {
  it("checkbox: Space still toggles aria-checked", async () => {
    page.goto("reg-cb", {
      role: "checkbox",
      items: ["cb-a"],
      focusedItemId: "cb-a",
    });
    await page.keyboard.press("Space");
    await page.locator("#cb-a").toHaveAttribute("aria-checked", "true");
  });

  it("switch: Space still toggles aria-checked", async () => {
    page.goto("reg-sw", {
      role: "switch",
      items: ["sw-a"],
      focusedItemId: "sw-a",
    });
    await page.keyboard.press("Space");
    await page.locator("#sw-a").toHaveAttribute("aria-checked", "true");
  });

  it("switch: Enter still toggles aria-checked", async () => {
    page.goto("reg-sw2", {
      role: "switch",
      items: ["sw-b"],
      focusedItemId: "sw-b",
    });
    await page.keyboard.press("Enter");
    await page.locator("#sw-b").toHaveAttribute("aria-checked", "true");
  });
});
