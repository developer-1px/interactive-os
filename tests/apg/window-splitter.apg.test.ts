/**
 * APG Window Splitter Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 *
 * W3C Window Splitter Pattern:
 *   - role="separator" on the focusable splitter element
 *   - aria-valuenow: current position (0–100)
 *   - aria-valuemin: minimum primary pane size (0)
 *   - aria-valuemax: maximum primary pane size (100)
 *   - aria-label or aria-labelledby: label for the separator
 *
 * Keyboard Interaction:
 *   - Left Arrow: move vertical splitter left (decrease value)
 *   - Right Arrow: move vertical splitter right (increase value)
 *   - Up Arrow: move horizontal splitter up (decrease value for horizontal)
 *   - Down Arrow: move horizontal splitter down (increase value for horizontal)
 *   - Enter: collapse primary pane if not collapsed; restore if collapsed
 *   - Home (Optional): set to minimum (primary pane smallest)
 *   - End (Optional): set to maximum (primary pane largest)
 *
 * ZIFT: Field(number) — same as Slider, but role=separator + Enter toggle.
 * Config: separator role, value axis with min/max/step, activate for Enter toggle.
 */

import { createOsPage } from "@os-sdk/app/defineApp/page";
import { describe, expect, it } from "vitest";

// ─── Test Setup ───

const SPLITTER_ID = "main-splitter";

function splitterFactory(initialValue = 50) {
  const page = createOsPage();
  page.setItems([SPLITTER_ID]);
  page.setRole("splitter-zone", "separator");
  page.setConfig({
    value: {
      min: 0,
      max: 100,
      step: 1,
      largeStep: 10,
    },
  });
  page.setActiveZone("splitter-zone", SPLITTER_ID);
  page.setValueNow(SPLITTER_ID, initialValue);
  return page;
}

// ═══════════════════════════════════════════════════════════════════
// Value Adjustment via Arrow Keys
// ═══════════════════════════════════════════════════════════════════

describe("APG Window Splitter: Arrow Key Value Changes", () => {
  it("Right Arrow: increases value by one step", () => {
    const t = splitterFactory(50);
    t.keyboard.press("ArrowRight");
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(51);
  });

  it("Up Arrow: increases value by one step", () => {
    const t = splitterFactory(50);
    t.keyboard.press("ArrowUp");
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(51);
  });

  it("Left Arrow: decreases value by one step", () => {
    const t = splitterFactory(50);
    t.keyboard.press("ArrowLeft");
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(49);
  });

  it("Down Arrow: decreases value by one step", () => {
    const t = splitterFactory(50);
    t.keyboard.press("ArrowDown");
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(49);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Boundary Clamping
// ═══════════════════════════════════════════════════════════════════

describe("APG Window Splitter: Boundary Clamping", () => {
  it("Right Arrow at max: value stays at max", () => {
    const t = splitterFactory(100);
    t.keyboard.press("ArrowRight");
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(100);
  });

  it("Left Arrow at min: value stays at min", () => {
    const t = splitterFactory(0);
    t.keyboard.press("ArrowLeft");
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Home / End — jump to min / max
// ═══════════════════════════════════════════════════════════════════

describe("APG Window Splitter: Home/End", () => {
  it("Home: sets value to minimum", () => {
    const t = splitterFactory(75);
    t.keyboard.press("Home");
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(0);
  });

  it("End: sets value to maximum", () => {
    const t = splitterFactory(25);
    t.keyboard.press("End");
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Enter — Collapse / Restore Toggle
// ═══════════════════════════════════════════════════════════════════

describe("APG Window Splitter: Enter Toggle (Collapse/Restore)", () => {
  it("Enter on expanded (non-zero): collapses to minimum", () => {
    const t = splitterFactory(50);
    t.keyboard.press("Enter");
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(0);
  });

  it("Enter on collapsed (at min): restores to previous position", () => {
    const t = splitterFactory(50);
    t.keyboard.press("Enter"); // collapse: 50 → 0
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(0);
    t.keyboard.press("Enter"); // restore: 0 → 50
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(50);
  });

  it("Enter collapse/restore preserves exact previous position", () => {
    const t = splitterFactory(73);
    t.keyboard.press("Enter"); // collapse: 73 → 0
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(0);
    t.keyboard.press("Enter"); // restore: 0 → 73
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(73);
  });

  it("adjusting value after collapse sets new restore point", () => {
    const t = splitterFactory(50);
    t.keyboard.press("Enter"); // collapse: 50 → 0
    // Manually set a non-zero value using arrow keys while collapsed
    t.keyboard.press("ArrowRight"); // 0 → 1 (now non-zero, no longer "collapsed")
    t.keyboard.press("Enter"); // collapse: 1 → 0
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(0);
    t.keyboard.press("Enter"); // restore: 0 → 1 (new restore point)
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════════════════════

describe("APG Window Splitter: DOM Projection (attrs)", () => {
  it("splitter has role=separator", () => {
    const t = splitterFactory(50);
    expect(t.attrs(SPLITTER_ID).role).toBe("separator");
  });

  it("splitter has aria-valuenow matching current value", () => {
    const t = splitterFactory(42);
    expect(t.attrs(SPLITTER_ID)["aria-valuenow"]).toBe(42);
  });

  it("splitter has aria-valuemin=0", () => {
    const t = splitterFactory(50);
    expect(t.attrs(SPLITTER_ID)["aria-valuemin"]).toBe(0);
  });

  it("splitter has aria-valuemax=100", () => {
    const t = splitterFactory(50);
    expect(t.attrs(SPLITTER_ID)["aria-valuemax"]).toBe(100);
  });

  it("focused splitter: tabIndex=0", () => {
    const t = splitterFactory(50);
    expect(t.attrs(SPLITTER_ID).tabIndex).toBe(0);
  });

  it("focused splitter: data-focused=true", () => {
    const t = splitterFactory(50);
    expect(t.attrs(SPLITTER_ID)["data-focused"]).toBe(true);
  });
});
