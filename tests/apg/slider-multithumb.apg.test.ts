/**
 * APG Slider (Multi-Thumb) Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/
 *
 * ZIFT Classification: Zone(navigation between thumbs via Tab) + Field(number value per thumb)
 *
 * W3C Multi-Thumb Slider Pattern:
 *   - Each thumb has role="slider" (same as single slider)
 *   - Each thumb is in the page Tab sequence (Tab moves between thumbs)
 *   - Each thumb has the same keyboard interaction as single slider:
 *       Right/Up Arrow: increase value by one step
 *       Left/Down Arrow: decrease value by one step
 *       Home: set to minimum value
 *       End: set to maximum value
 *       Page Up: increase by large step (optional)
 *       Page Down: decrease by large step (optional)
 *   - Tab order remains constant regardless of thumb position or value changes
 *   - aria-valuenow, aria-valuemin, aria-valuemax on each thumb
 *   - Dependent thumbs: aria-valuemin/aria-valuemax update dynamically
 *     (OS gap: per-item value constraints not yet supported — zone-level min/max only)
 *
 * Config: slider role (value axis), tab.behavior="flow" (Tab between thumbs)
 */

import { createOsPage } from "@os-sdk/app/defineApp/page";
import { describe, expect, it } from "vitest";

// ─── Test Setup ───

const THUMB_MIN = "thumb-min";
const THUMB_MAX = "thumb-max";
const THUMBS = [THUMB_MIN, THUMB_MAX];

/**
 * Factory: Hotel price range slider (two thumbs on a single rail).
 * min=0, max=400, step=10, largeStep=50.
 * thumb-min starts at 100, thumb-max starts at 300.
 */
function multiThumbFactory(focusedThumb = THUMB_MIN) {
  const page = createOsPage();
  page.setItems(THUMBS);
  page.setRole("price-range-zone", "slider");
  page.setConfig({
    value: {
      min: 0,
      max: 400,
      step: 10,
      largeStep: 50,
    },
    tab: { behavior: "flow" },
  });
  page.setActiveZone("price-range-zone", focusedThumb);
  page.setValueNow(THUMB_MIN, 100);
  page.setValueNow(THUMB_MAX, 300);
  return page;
}

// ═══════════════════════════════════════════════════════════════════
// Value Adjustment — Each Thumb Independently Adjusts
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider Multi-Thumb: Value Adjustment (Arrow Keys)", () => {
  it("Right Arrow on thumb-min: increases its value by one step", () => {
    const t = multiThumbFactory(THUMB_MIN);
    t.keyboard.press("ArrowRight");
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(110);
    // thumb-max unchanged
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(300);
  });

  it("Up Arrow on thumb-min: increases its value by one step", () => {
    const t = multiThumbFactory(THUMB_MIN);
    t.keyboard.press("ArrowUp");
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(110);
  });

  it("Left Arrow on thumb-max: decreases its value by one step", () => {
    const t = multiThumbFactory(THUMB_MAX);
    t.keyboard.press("ArrowLeft");
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(290);
    // thumb-min unchanged
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(100);
  });

  it("Down Arrow on thumb-max: decreases its value by one step", () => {
    const t = multiThumbFactory(THUMB_MAX);
    t.keyboard.press("ArrowDown");
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(290);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Boundary Clamping — Zone-level min/max
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider Multi-Thumb: Boundary Clamping", () => {
  it("thumb-min at zone min: Left Arrow stays clamped", () => {
    const t = multiThumbFactory(THUMB_MIN);
    t.setValueNow(THUMB_MIN, 0);
    t.keyboard.press("ArrowLeft");
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(0);
  });

  it("thumb-max at zone max: Right Arrow stays clamped", () => {
    const t = multiThumbFactory(THUMB_MAX);
    t.setValueNow(THUMB_MAX, 400);
    t.keyboard.press("ArrowRight");
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Home / End — Jump to min / max
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider Multi-Thumb: Home/End", () => {
  it("Home on thumb-min: sets value to zone minimum", () => {
    const t = multiThumbFactory(THUMB_MIN);
    t.keyboard.press("Home");
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(0);
  });

  it("End on thumb-max: sets value to zone maximum", () => {
    const t = multiThumbFactory(THUMB_MAX);
    t.keyboard.press("End");
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(400);
  });

  it("Home on thumb-max: sets value to zone minimum (independent)", () => {
    const t = multiThumbFactory(THUMB_MAX);
    t.keyboard.press("Home");
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(0);
  });

  it("End on thumb-min: sets value to zone maximum (independent)", () => {
    const t = multiThumbFactory(THUMB_MIN);
    t.keyboard.press("End");
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Page Up / Page Down — Large Step
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider Multi-Thumb: Page Up/Down (large step)", () => {
  it("Page Up on thumb-min: increases by large step", () => {
    const t = multiThumbFactory(THUMB_MIN);
    t.keyboard.press("PageUp");
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(150);
  });

  it("Page Down on thumb-max: decreases by large step", () => {
    const t = multiThumbFactory(THUMB_MAX);
    t.keyboard.press("PageDown");
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(250);
  });

  it("Page Up clamped at max", () => {
    const t = multiThumbFactory(THUMB_MAX);
    t.setValueNow(THUMB_MAX, 380);
    t.keyboard.press("PageUp");
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(400);
  });

  it("Page Down clamped at min", () => {
    const t = multiThumbFactory(THUMB_MIN);
    t.setValueNow(THUMB_MIN, 20);
    t.keyboard.press("PageDown");
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tab Navigation Between Thumbs
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider Multi-Thumb: Tab Navigation", () => {
  it("Tab from thumb-min: moves focus to thumb-max", () => {
    const t = multiThumbFactory(THUMB_MIN);
    t.keyboard.press("Tab");
    expect(t.focusedItemId()).toBe(THUMB_MAX);
  });

  it("Shift+Tab from thumb-max: moves focus to thumb-min", () => {
    const t = multiThumbFactory(THUMB_MAX);
    t.keyboard.press("Shift+Tab");
    expect(t.focusedItemId()).toBe(THUMB_MIN);
  });

  it("Tab order is constant: thumb-min always before thumb-max", () => {
    // Even if thumb-min value > thumb-max value (invalid state), tab order stays
    const t = multiThumbFactory(THUMB_MIN);
    t.setValueNow(THUMB_MIN, 350);
    t.setValueNow(THUMB_MAX, 100);
    t.keyboard.press("Tab");
    expect(t.focusedItemId()).toBe(THUMB_MAX);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA Attributes
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider Multi-Thumb: DOM Projection (attrs)", () => {
  it("both thumbs have role=slider", () => {
    const t = multiThumbFactory(THUMB_MIN);
    expect(t.attrs(THUMB_MIN).role).toBe("slider");
    expect(t.attrs(THUMB_MAX).role).toBe("slider");
  });

  it("each thumb has its own aria-valuenow", () => {
    const t = multiThumbFactory(THUMB_MIN);
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(100);
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(300);
  });

  it("both thumbs have aria-valuemin and aria-valuemax", () => {
    const t = multiThumbFactory(THUMB_MIN);
    expect(t.attrs(THUMB_MIN)["aria-valuemin"]).toBe(0);
    expect(t.attrs(THUMB_MIN)["aria-valuemax"]).toBe(400);
    expect(t.attrs(THUMB_MAX)["aria-valuemin"]).toBe(0);
    expect(t.attrs(THUMB_MAX)["aria-valuemax"]).toBe(400);
  });

  it("focused thumb: tabIndex=0, other: tabIndex=-1", () => {
    const t = multiThumbFactory(THUMB_MIN);
    expect(t.attrs(THUMB_MIN).tabIndex).toBe(0);
    expect(t.attrs(THUMB_MAX).tabIndex).toBe(-1);
  });

  it("focused thumb: data-focused=true", () => {
    const t = multiThumbFactory(THUMB_MIN);
    expect(t.attrs(THUMB_MIN)["data-focused"]).toBe(true);
    expect(t.attrs(THUMB_MAX)["data-focused"]).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Independent Value Changes — Adjusting one thumb doesn't affect other
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider Multi-Thumb: Independent Values", () => {
  it("multiple adjustments on thumb-min preserve thumb-max", () => {
    const t = multiThumbFactory(THUMB_MIN);
    t.keyboard.press("ArrowRight");
    t.keyboard.press("ArrowRight");
    t.keyboard.press("ArrowRight");
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(130);
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(300);
  });

  it("switching thumbs and adjusting: both maintain their values", () => {
    const t = multiThumbFactory(THUMB_MIN);
    // Adjust thumb-min
    t.keyboard.press("ArrowRight"); // 110
    // Switch to thumb-max via Tab
    t.keyboard.press("Tab");
    expect(t.focusedItemId()).toBe(THUMB_MAX);
    // Adjust thumb-max
    t.keyboard.press("ArrowLeft"); // 290
    // Verify both values
    expect(t.attrs(THUMB_MIN)["aria-valuenow"]).toBe(110);
    expect(t.attrs(THUMB_MAX)["aria-valuenow"]).toBe(290);
  });
});
