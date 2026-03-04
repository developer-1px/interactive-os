/**
 * APG Spinbutton Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 *
 * ZIFT Classification: Field (number) — edits a numeric value within a bounded range.
 * Same FieldType as Slider. OS handles Arrow/Home/End/Page via NUMBER_KEYMAP.
 *
 * W3C Spinbutton Pattern:
 *   - role="spinbutton" on the focusable element
 *   - aria-valuenow: current numeric value
 *   - aria-valuemin: minimum allowed value
 *   - aria-valuemax: maximum allowed value
 *   - aria-valuetext: (optional) human-readable string alternative
 *
 * Keyboard Interaction:
 *   - Up Arrow: increase value by one step
 *   - Down Arrow: decrease value by one step
 *   - Home: set to minimum value (if spinbutton has a minimum)
 *   - End: set to maximum value (if spinbutton has a maximum)
 *   - Page Up (optional): increase by large step
 *   - Page Down (optional): decrease by large step
 *
 * Key difference from Slider:
 *   - Slider uses ALL four arrow keys (Up/Right = increment, Down/Left = decrement)
 *   - Spinbutton uses only Up/Down arrows (vertical only)
 *   - Spinbutton may optionally allow direct text input (not tested here)
 *
 * Config: spinbutton role, value axis with min/max/step/now
 */

import { createOsPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";

// ─── Test Setup ───

const SPINBUTTON_ID = "quantity-spinner";

function spinbuttonFactory(initialValue = 5) {
  const page = createOsPage();
  page.setItems([SPINBUTTON_ID]);
  page.setRole("spinbutton-zone", "spinbutton");
  page.setConfig({
    value: {
      min: 0,
      max: 10,
      step: 1,
      largeStep: 3,
    },
  });
  page.setActiveZone("spinbutton-zone", SPINBUTTON_ID);
  page.setValueNow(SPINBUTTON_ID, initialValue);
  return page;
}

// ═══════════════════════════════════════════════════════════════════
// Value Increment/Decrement via Arrow Keys
// ═══════════════════════════════════════════════════════════════════

describe("APG Spinbutton: Arrow Key Value Changes", () => {
  it("Up Arrow: increases value by one step", () => {
    const t = spinbuttonFactory(5);
    t.keyboard.press("ArrowUp");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(6);
  });

  it("Down Arrow: decreases value by one step", () => {
    const t = spinbuttonFactory(5);
    t.keyboard.press("ArrowDown");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Boundary Clamping
// ═══════════════════════════════════════════════════════════════════

describe("APG Spinbutton: Boundary Clamping", () => {
  it("Up Arrow at max: value stays at max", () => {
    const t = spinbuttonFactory(10);
    t.keyboard.press("ArrowUp");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(10);
  });

  it("Down Arrow at min: value stays at min", () => {
    const t = spinbuttonFactory(0);
    t.keyboard.press("ArrowDown");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Home / End — jump to min / max
// ═══════════════════════════════════════════════════════════════════

describe("APG Spinbutton: Home/End", () => {
  it("Home: sets value to minimum", () => {
    const t = spinbuttonFactory(7);
    t.keyboard.press("Home");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(0);
  });

  it("End: sets value to maximum", () => {
    const t = spinbuttonFactory(3);
    t.keyboard.press("End");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Page Up / Page Down — large step
// ═══════════════════════════════════════════════════════════════════

describe("APG Spinbutton: Page Up/Down (large step)", () => {
  it("Page Up: increases value by large step", () => {
    const t = spinbuttonFactory(5);
    t.keyboard.press("PageUp");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(8);
  });

  it("Page Down: decreases value by large step", () => {
    const t = spinbuttonFactory(5);
    t.keyboard.press("PageDown");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(2);
  });

  it("Page Up clamped at max", () => {
    const t = spinbuttonFactory(9);
    t.keyboard.press("PageUp");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(10);
  });

  it("Page Down clamped at min", () => {
    const t = spinbuttonFactory(1);
    t.keyboard.press("PageDown");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════════════════════

describe("APG Spinbutton: DOM Projection (attrs)", () => {
  it("has role=spinbutton", () => {
    const t = spinbuttonFactory(5);
    expect(t.attrs(SPINBUTTON_ID).role).toBe("spinbutton");
  });

  it("has aria-valuenow matching current value", () => {
    const t = spinbuttonFactory(7);
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBe(7);
  });

  it("has aria-valuemin", () => {
    const t = spinbuttonFactory(5);
    expect(t.attrs(SPINBUTTON_ID)["aria-valuemin"]).toBe(0);
  });

  it("has aria-valuemax", () => {
    const t = spinbuttonFactory(5);
    expect(t.attrs(SPINBUTTON_ID)["aria-valuemax"]).toBe(10);
  });

  it("focused spinbutton: tabIndex=0", () => {
    const t = spinbuttonFactory(5);
    expect(t.attrs(SPINBUTTON_ID).tabIndex).toBe(0);
  });

  it("focused spinbutton: data-focused=true", () => {
    const t = spinbuttonFactory(5);
    expect(t.attrs(SPINBUTTON_ID)["data-focused"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Multi-item zone — multiple spinbuttons with independent values
// ═══════════════════════════════════════════════════════════════════

describe("APG Spinbutton: Multi-item zone", () => {
  const ITEMS = ["spinner-hours", "spinner-minutes", "spinner-seconds"];

  function multiFactory(focusedItem = "spinner-hours") {
    const page = createOsPage();
    page.setItems(ITEMS);
    page.setRole("time-zone", "spinbutton");
    page.setConfig({
      value: {
        min: 0,
        max: 59,
        step: 1,
        largeStep: 10,
      },
    });
    page.setActiveZone("time-zone", focusedItem);
    page.setValueNow("spinner-hours", 12);
    page.setValueNow("spinner-minutes", 30);
    page.setValueNow("spinner-seconds", 45);
    return page;
  }

  it("Up Arrow changes only the focused spinbutton value", () => {
    const t = multiFactory("spinner-minutes");
    t.keyboard.press("ArrowUp");
    expect(t.attrs("spinner-minutes")["aria-valuenow"]).toBe(31);
    expect(t.attrs("spinner-hours")["aria-valuenow"]).toBe(12);
    expect(t.attrs("spinner-seconds")["aria-valuenow"]).toBe(45);
  });

  it("each spinbutton maintains independent value state", () => {
    const t = multiFactory("spinner-hours");
    t.keyboard.press("ArrowUp");
    expect(t.attrs("spinner-hours")["aria-valuenow"]).toBe(13);
    expect(t.attrs("spinner-minutes")["aria-valuenow"]).toBe(30);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Step precision — fractional steps
// ═══════════════════════════════════════════════════════════════════

describe("APG Spinbutton: Fractional Steps", () => {
  function fractionalFactory(initialValue = 0.5) {
    const page = createOsPage();
    page.setItems([SPINBUTTON_ID]);
    page.setRole("spinbutton-zone", "spinbutton");
    page.setConfig({
      value: {
        min: 0,
        max: 1,
        step: 0.1,
        largeStep: 0.25,
      },
    });
    page.setActiveZone("spinbutton-zone", SPINBUTTON_ID);
    page.setValueNow(SPINBUTTON_ID, initialValue);
    return page;
  }

  it("step=0.1: ArrowUp increments by 0.1", () => {
    const t = fractionalFactory(0.5);
    t.keyboard.press("ArrowUp");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBeCloseTo(0.6, 5);
  });

  it("step=0.1: ArrowDown decrements by 0.1", () => {
    const t = fractionalFactory(0.5);
    t.keyboard.press("ArrowDown");
    expect(t.attrs(SPINBUTTON_ID)["aria-valuenow"]).toBeCloseTo(0.4, 5);
  });
});
