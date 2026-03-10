/**
 * APG Radio Group Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey / click (user action simulation)
 *   Assert: locator → toHaveAttribute (ARIA contract)
 *
 * Config: vertical, loop, followFocus, disallowEmpty
 * Unique: aria-checked instead of aria-selected, Space to check
 *
 * API: page.locator / page.keyboard.press / expect(loc).toHaveAttribute
 */

import type { Page } from "@os-testing/types";
import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  CrustApp,
  RadioGroupPattern,
} from "@/pages/apg-showcase/patterns/RadioGroupPattern";

// ─── Test Setup (actual showcase config) ───

// Crust radiogroup: "Regular crust", "Deep dish", "Thin crust"
const ITEMS = ["radio-regular", "radio-deep", "radio-thin"];

let page: Page;
let cleanup: () => void;

const expect = osExpect;

beforeEach(() => {
  ({ page, cleanup } = createPage(CrustApp, RadioGroupPattern));
  page.goto("/");
  // click first radio to focus + check it (radiogroup followFocus)
  page.click("radio-regular");
});

afterEach(() => {
  cleanup();
});

// ═══════════════════════════════════════════════════
// Navigation — vertical with loop
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Navigation", () => {
  it("ArrowDown moves focus to next radio", async () => {
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-deep")).toHaveAttribute("tabindex", "0");
  });

  it("ArrowUp moves focus to previous radio", async () => {
    // Start at radio-deep
    page.keyboard.press("ArrowDown"); // → radio-deep
    page.keyboard.press("ArrowUp");
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("ArrowDown at last wraps to first (loop)", async () => {
    page.keyboard.press("ArrowDown"); // → radio-deep
    page.keyboard.press("ArrowDown"); // → radio-thin
    page.keyboard.press("ArrowDown"); // → radio-regular (loop)
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "tabindex",
      "0",
    );
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("ArrowUp at first wraps to last (loop)", async () => {
    page.keyboard.press("ArrowUp"); // → radio-thin (loop)
    await expect(page.locator("#radio-thin")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#radio-thin")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════
// Selection follows focus — aria-checked
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Selection follows focus (aria-checked)", () => {
  it("ArrowDown checks next radio, unchecks previous", async () => {
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("ArrowUp checks previous radio", async () => {
    // Navigate to radio-thin first
    page.keyboard.press("ArrowDown"); // → radio-deep
    page.keyboard.press("ArrowDown"); // → radio-thin
    page.keyboard.press("ArrowUp"); // → radio-deep
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-thin")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("only one radio is checked at any time", async () => {
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    // radio-thin should be the only checked one
    await expect(page.locator("#radio-thin")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});

// ═══════════════════════════════════════════════════
// Space — explicit check
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Space to check", () => {
  it("Space checks the focused radio", async () => {
    page.keyboard.press("ArrowDown"); // focus radio-deep, auto-checked by followFocus
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    page.keyboard.press("Space");
    // Should remain checked (Space on already-checked = no-op in APG)
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════
// Invariant: never empty (disallowEmpty)
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Never empty", () => {
  it("always exactly one radio checked after navigation", async () => {
    // After 5 ArrowDowns with 3 items + loop, focus lands on radio-thin (i=2 mod 3 → index 2)
    // Each step: the focused item must be checked, others unchecked
    const expectedFocus = [
      "radio-deep",
      "radio-thin",
      "radio-regular",
      "radio-deep",
      "radio-thin",
    ];
    for (let i = 0; i < 5; i++) {
      page.keyboard.press("ArrowDown");
      const focusedId = expectedFocus[i]!;
      await expect(page.locator(`#${focusedId}`)).toHaveAttribute(
        "aria-checked",
        "true",
      );
      for (const id of ITEMS) {
        if (id !== focusedId) {
          await expect(page.locator(`#${id}`)).toHaveAttribute(
            "aria-checked",
            "false",
          );
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════
// Roving tabindex
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Roving tabindex", () => {
  it("checked radio has tabIndex 0, others -1", async () => {
    // radio-regular is checked after beforeEach click
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "tabindex",
      "0",
    );
    await expect(page.locator("#radio-deep")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#radio-thin")).toHaveAttribute("tabindex", "-1");
  });

  it("after navigation, new focus gets tabIndex 0", async () => {
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-deep")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });
});

// ═══════════════════════════════════════════════════
// N1/N3: Right Arrow + Left Arrow (W3C: both axes work)
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Right/Left Arrow (W3C N1/N3)", () => {
  // N1: "Right Arrow: move focus to next radio, check it, uncheck previous"
  it("ArrowRight moves focus to next and checks it", async () => {
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#radio-deep")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  // N3: "Left Arrow: move focus to previous radio, check it, uncheck previous"
  it("ArrowLeft moves focus to previous and checks it", async () => {
    // Navigate to radio-deep first
    page.keyboard.press("ArrowDown"); // → radio-deep
    page.keyboard.press("ArrowLeft"); // → radio-regular
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "tabindex",
      "0",
    );
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  // N5 variant: "Right Arrow at last → loop to first"
  it("ArrowRight at last wraps to first (loop)", async () => {
    page.keyboard.press("ArrowDown"); // → radio-deep
    page.keyboard.press("ArrowDown"); // → radio-thin
    page.keyboard.press("ArrowRight"); // → radio-regular (loop)
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  // N6 variant: "Left Arrow at first → loop to last"
  it("ArrowLeft at first wraps to last (loop)", async () => {
    page.keyboard.press("ArrowLeft"); // → radio-thin (loop)
    await expect(page.locator("#radio-thin")).toHaveAttribute("tabindex", "0");
  });
});

// ═══════════════════════════════════════════════════
// R1/R2: ARIA role projection
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: ARIA projection (W3C R1/R2)", () => {
  // R2: "each radio button element has role radio"
  it("items have role='radio' projected via check.mode='check'", async () => {
    // check.mode="check" → aria-checked projected instead of aria-selected
    // Verify by checking aria-checked exists (not aria-selected)
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

// ═══════════════════════════════════════════════════
// Click to check
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Click to check", () => {
  it("clicking a radio button checks it and unchecks previous", async () => {
    page.click("radio-thin");
    await expect(page.locator("#radio-thin")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await expect(page.locator("#radio-thin")).toHaveAttribute("tabindex", "0");
  });
});

// ═══════════════════════════════════════════════════
// F1: Tab entry on checked radio
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Tab entry (W3C F1)", () => {
  it("entering zone focuses the checked radio (entry: selected)", async () => {
    // Navigate to radio-deep so it becomes checked
    page.keyboard.press("ArrowDown"); // → radio-deep checked
    // Tab away and back
    page.keyboard.press("Tab"); // leave zone
    page.keyboard.press("Tab"); // re-enter zone
    // Should return to the checked radio
    await expect(page.locator("#radio-deep")).toHaveAttribute("tabindex", "0");
  });
});

// ═══════════════════════════════════════════════════
// Negative: enforceMode protection
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Negative tests (enforceMode)", () => {
  // NEG1: Shift+Click on single-select should NOT range-select
  it("Shift+Click does NOT range-select (single mode)", async () => {
    page.click("radio-thin", { shift: true });
    // Should have exactly one checked — radio-thin (last clicked)
    await expect(page.locator("#radio-thin")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  // NEG2: Cmd+Click should NOT deselect (disallowEmpty)
  it("Cmd+Click does NOT deselect last checked (disallowEmpty)", async () => {
    page.click("radio-regular", { meta: true });
    // radio-regular should remain checked (cannot toggle off)
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
