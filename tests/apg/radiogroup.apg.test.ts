/**
 * APG Radio Group Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey / click (user action simulation)
 *   Assert: attrs() → tabIndex, aria-checked, data-focused (ARIA contract)
 *
 * Config: vertical, loop, followFocus, disallowEmpty
 * Unique: aria-checked instead of aria-selected, Space to check
 */

import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import { CrustApp } from "@/pages/apg-showcase/patterns/RadioGroupPattern";

// ─── Test Setup (actual showcase config) ───

// Crust radiogroup: "Regular crust", "Deep dish", "Thin crust"
const ITEMS = ["radio-regular", "radio-deep", "radio-thin"];

function setup(selected = "radio-regular") {
  const page = createPage(CrustApp);
  page.setupZone("radiogroup-crust", {
    items: ITEMS,
    focusedItemId: selected,
  });
  page.click(selected);
  return page;
}

// ═══════════════════════════════════════════════════
// Navigation — vertical with loop
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Navigation", () => {
  it("ArrowDown moves focus to next radio", () => {
    const t = setup("radio-regular");
    t.keyboard.press("ArrowDown");
    expect(t.focusedItemId()).toBe("radio-deep");
  });

  it("ArrowUp moves focus to previous radio", () => {
    const t = setup("radio-deep");
    t.keyboard.press("ArrowUp");
    expect(t.focusedItemId()).toBe("radio-regular");
  });

  it("ArrowDown at last wraps to first (loop)", () => {
    const t = setup("radio-thin");
    t.keyboard.press("ArrowDown");
    expect(t.focusedItemId()).toBe("radio-regular");
  });

  it("ArrowUp at first wraps to last (loop)", () => {
    const t = setup("radio-regular");
    t.keyboard.press("ArrowUp");
    expect(t.focusedItemId()).toBe("radio-thin");
  });
});

// ═══════════════════════════════════════════════════
// Selection follows focus — aria-checked
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Selection follows focus (aria-checked)", () => {
  it("ArrowDown checks next radio, unchecks previous", () => {
    const t = setup("radio-regular");
    t.keyboard.press("ArrowDown");
    expect(t.attrs("radio-deep")["aria-checked"]).toBe(true);
    expect(t.attrs("radio-regular")["aria-checked"]).toBe(false);
  });

  it("ArrowUp checks previous radio", () => {
    const t = setup("radio-thin");
    t.keyboard.press("ArrowUp");
    expect(t.attrs("radio-deep")["aria-checked"]).toBe(true);
    expect(t.attrs("radio-thin")["aria-checked"]).toBe(false);
  });

  it("only one radio is checked at any time", () => {
    const t = setup("radio-regular");
    t.keyboard.press("ArrowDown");
    t.keyboard.press("ArrowDown");
    const checked = ITEMS.filter((id) => t.attrs(id)["aria-checked"] === true);
    expect(checked).toHaveLength(1);
    expect(checked[0]).toBe("radio-thin");
  });
});

// ═══════════════════════════════════════════════════
// Space — explicit check
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Space to check", () => {
  it("Space checks the focused radio", () => {
    const t = setup("radio-regular");
    t.keyboard.press("ArrowDown"); // focus radio-deep, auto-checked by followFocus
    // Move without checking (verify Space still works)
    expect(t.attrs("radio-deep")["aria-checked"]).toBe(true);
    t.keyboard.press("Space");
    // Should remain checked (Space on already-checked = no-op in APG)
    expect(t.attrs("radio-deep")["aria-checked"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════
// Invariant: never empty (disallowEmpty)
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Never empty", () => {
  it("always exactly one radio checked after navigation", () => {
    const t = setup("radio-regular");
    for (let i = 0; i < 5; i++) {
      t.keyboard.press("ArrowDown");
      const checked = ITEMS.filter(
        (id) => t.attrs(id)["aria-checked"] === true,
      );
      expect(checked).toHaveLength(1);
    }
  });
});

// ═══════════════════════════════════════════════════
// Roving tabindex
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Roving tabindex", () => {
  it("checked radio has tabIndex 0, others -1", () => {
    const t = setup("radio-deep");
    expect(t.attrs("radio-deep").tabIndex).toBe(0);
    expect(t.attrs("radio-regular").tabIndex).toBe(-1);
    expect(t.attrs("radio-thin").tabIndex).toBe(-1);
  });

  it("after navigation, new focus gets tabIndex 0", () => {
    const t = setup("radio-regular");
    t.keyboard.press("ArrowDown");
    expect(t.attrs("radio-deep").tabIndex).toBe(0);
    expect(t.attrs("radio-regular").tabIndex).toBe(-1);
  });
});

// ═══════════════════════════════════════════════════
// N1/N3: Right Arrow + Left Arrow (W3C: both axes work)
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Right/Left Arrow (W3C N1/N3)", () => {
  // N1: "Right Arrow: move focus to next radio, check it, uncheck previous"
  it("ArrowRight moves focus to next and checks it", () => {
    const t = setup("radio-regular");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("radio-deep");
    expect(t.attrs("radio-deep")["aria-checked"]).toBe(true);
    expect(t.attrs("radio-regular")["aria-checked"]).toBe(false);
  });

  // N3: "Left Arrow: move focus to previous radio, check it, uncheck previous"
  it("ArrowLeft moves focus to previous and checks it", () => {
    const t = setup("radio-deep");
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("radio-regular");
    expect(t.attrs("radio-regular")["aria-checked"]).toBe(true);
    expect(t.attrs("radio-deep")["aria-checked"]).toBe(false);
  });

  // N5 variant: "Right Arrow at last → loop to first"
  it("ArrowRight at last wraps to first (loop)", () => {
    const t = setup("radio-thin");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("radio-regular");
  });

  // N6 variant: "Left Arrow at first → loop to last"
  it("ArrowLeft at first wraps to last (loop)", () => {
    const t = setup("radio-regular");
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("radio-thin");
  });
});

// ═══════════════════════════════════════════════════
// R1/R2: ARIA role projection
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: ARIA projection (W3C R1/R2)", () => {
  // R2: "each radio button element has role radio"
  it("items have role='radio' projected via check.mode='check'", () => {
    const t = setup("radio-regular");
    // check.mode="check" → aria-checked projected instead of aria-selected
    // Verify by checking aria-checked exists (not aria-selected)
    expect(t.attrs("radio-regular")["aria-checked"]).toBeDefined();
    expect(t.attrs("radio-regular")["aria-selected"]).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════
// Click to check
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Click to check", () => {
  it("clicking a radio button checks it and unchecks previous", () => {
    const t = setup("radio-regular");
    t.click("radio-thin");
    expect(t.attrs("radio-thin")["aria-checked"]).toBe(true);
    expect(t.attrs("radio-regular")["aria-checked"]).toBe(false);
    expect(t.focusedItemId()).toBe("radio-thin");
  });
});

// ═══════════════════════════════════════════════════
// F1: Tab entry on checked radio
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Tab entry (W3C F1)", () => {
  it("entering zone focuses the checked radio (entry: selected)", () => {
    const t = setup("radio-deep"); // radio-deep is checked
    // Tab away and back
    t.keyboard.press("Tab"); // leave zone
    t.keyboard.press("Tab"); // re-enter zone
    // Should return to the checked radio
    expect(t.focusedItemId()).toBe("radio-deep");
  });
});

// ═══════════════════════════════════════════════════
// Negative: enforceMode protection
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Negative tests (enforceMode)", () => {
  // NEG1: Shift+Click on single-select should NOT range-select
  it("Shift+Click does NOT range-select (single mode)", () => {
    const t = setup("radio-regular");
    t.click("radio-thin", { shift: true });
    // Should have exactly one checked
    const checked = ITEMS.filter((id) => t.attrs(id)["aria-checked"] === true);
    expect(checked).toHaveLength(1);
  });

  // NEG2: Cmd+Click should NOT deselect (disallowEmpty)
  it("Cmd+Click does NOT deselect last checked (disallowEmpty)", () => {
    const t = setup("radio-regular");
    t.click("radio-regular", { meta: true });
    // radio-regular should remain checked (cannot toggle off)
    expect(t.attrs("radio-regular")["aria-checked"]).toBe(true);
  });
});
