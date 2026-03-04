/**
 * APG Checkbox Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 *
 * W3C Checkbox Pattern:
 *   - role="checkbox" on the focusable element
 *   - aria-checked="true" / "false" / "mixed" — current state
 *   - Space: toggle checked state
 *   - Enter: does NOT toggle state (per APG spec)
 *   - Focusable (tabIndex=0 when focused)
 */

import { createOsPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";

// ─── Test Setup ───

const CHECKBOX_ID = "terms-checkbox";
const TRI_CHECKBOX_ID = "all-options-checkbox";

function checkboxFactory() {
  const page = createOsPage();
  page.setItems([CHECKBOX_ID, TRI_CHECKBOX_ID]);
  page.setRole("checkbox-zone", "checkbox");
  page.setConfig({
    check: { mode: "check" },
  });
  page.setActiveZone("checkbox-zone", CHECKBOX_ID);
  return page;
}

function checkboxFactoryOn() {
  const page = checkboxFactory();
  page.keyboard.press("Space");
  return page;
}

// ═══════════════════════════════════════════════════════════════════
// Toggle via Space (K1)
// ═══════════════════════════════════════════════════════════════════

describe("APG Checkbox: Toggle via Space (K1)", () => {
  it("Space on unchecked checkbox: toggles to checked", () => {
    const t = checkboxFactory();
    expect(t.attrs(CHECKBOX_ID)["aria-checked"]).toBe(false);

    t.keyboard.press("Space");

    expect(t.attrs(CHECKBOX_ID)["aria-checked"]).toBe(true);
  });

  it("Space on checked checkbox: toggles to unchecked", () => {
    const t = checkboxFactoryOn();
    expect(t.attrs(CHECKBOX_ID)["aria-checked"]).toBe(true);

    t.keyboard.press("Space");

    expect(t.attrs(CHECKBOX_ID)["aria-checked"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Enter does NOT toggle (per APG)
// ═══════════════════════════════════════════════════════════════════

describe("APG Checkbox: Enter should not toggle", () => {
  it("Enter on unchecked checkbox: remains unchecked", () => {
    const t = checkboxFactory();
    expect(t.attrs(CHECKBOX_ID)["aria-checked"]).toBe(false);

    t.keyboard.press("Enter");

    // Fails here if Enter incorrectly triggers OS_CHECK
    expect(t.attrs(CHECKBOX_ID)["aria-checked"]).toBe(false);
  });
});

// Removed: Click interaction. The DOM handles click for checkboxes; OS doesn't mandate it.

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes (A1, A2, A3, A4)
// ═══════════════════════════════════════════════════════════════════

describe("APG Checkbox: DOM Projection (attrs)", () => {
  it("item has role=checkbox (A1)", () => {
    const t = checkboxFactory();
    expect(t.attrs(CHECKBOX_ID).role).toBe("checkbox");
  });

  it("unchecked checkbox: aria-checked=false (A3)", () => {
    const t = checkboxFactory();
    expect(t.attrs(CHECKBOX_ID)["aria-checked"]).toBe(false);
  });

  it("checked checkbox: aria-checked=true (A2)", () => {
    const t = checkboxFactoryOn();
    expect(t.attrs(CHECKBOX_ID)["aria-checked"]).toBe(true);
  });

  it("focused checkbox: tabIndex=0", () => {
    const t = checkboxFactory();
    expect(t.attrs(CHECKBOX_ID).tabIndex).toBe(0);
  });

  // Note: Tri-state (mixed) testing will require OS level support for explicit value
  // since OS_CHECK (selection) is boolean. We will implement "mixed" via Field value.
});
