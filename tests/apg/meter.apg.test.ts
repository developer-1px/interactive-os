/**
 * APG Meter Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 *
 * W3C Meter Pattern:
 *   - role="meter" on the element displaying a numeric value
 *   - aria-valuenow: current value (required)
 *   - aria-valuemin: minimum value (required)
 *   - aria-valuemax: maximum value (required)
 *   - aria-valuetext: (optional) human-readable text representation
 *   - aria-label or aria-labelledby: accessible name
 *   - Keyboard interaction: NOT APPLICABLE (read-only display)
 *
 * ZIFT Classification: Field (readonly)
 *   Meter is a read-only numeric display. No user interaction.
 *   Values are set externally (e.g. CPU usage, battery level).
 *   OS projects aria-valuenow/min/max via value config axis.
 *
 * Config: meter role, value axis with min/max, no keyboard interaction
 */

import { createOsPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";

// ─── Test Setup ───

const METER_ID = "cpu-meter";

function meterFactory(initialValue = 50) {
  const page = createOsPage();
  page.setItems([METER_ID]);
  page.setRole("meter-zone", "meter");
  page.setConfig({
    value: {
      min: 0,
      max: 100,
      step: 1,
      largeStep: 10,
    },
  });
  page.setActiveZone("meter-zone", METER_ID);
  page.setValueNow(METER_ID, initialValue);
  return page;
}

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes (core meter requirements)
// ═══════════════════════════════════════════════════════════════════

describe("APG Meter: DOM Projection (attrs)", () => {
  it("item has role=meter", () => {
    const t = meterFactory(50);
    expect(t.attrs(METER_ID).role).toBe("meter");
  });

  it("aria-valuenow reflects current value", () => {
    const t = meterFactory(42);
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(42);
  });

  it("aria-valuemin reflects minimum", () => {
    const t = meterFactory(50);
    expect(t.attrs(METER_ID)["aria-valuemin"]).toBe(0);
  });

  it("aria-valuemax reflects maximum", () => {
    const t = meterFactory(50);
    expect(t.attrs(METER_ID)["aria-valuemax"]).toBe(100);
  });

  it("focused meter: tabIndex=0", () => {
    const t = meterFactory(50);
    expect(t.attrs(METER_ID).tabIndex).toBe(0);
  });

  it("focused meter: data-focused=true", () => {
    const t = meterFactory(50);
    expect(t.attrs(METER_ID)["data-focused"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Value range: various positions
// ═══════════════════════════════════════════════════════════════════

describe("APG Meter: Value at different positions", () => {
  it("value at minimum", () => {
    const t = meterFactory(0);
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(0);
  });

  it("value at maximum", () => {
    const t = meterFactory(100);
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(100);
  });

  it("value at midpoint", () => {
    const t = meterFactory(50);
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════
// External value updates (meter is read-only, values change externally)
// ═══════════════════════════════════════════════════════════════════

describe("APG Meter: External value updates", () => {
  it("setValueNow updates aria-valuenow", () => {
    const t = meterFactory(30);
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(30);

    t.setValueNow(METER_ID, 75);
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(75);
  });

  it("multiple value updates track correctly", () => {
    const t = meterFactory(10);

    t.setValueNow(METER_ID, 50);
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(50);

    t.setValueNow(METER_ID, 90);
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(90);

    t.setValueNow(METER_ID, 0);
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// No keyboard interaction (APG spec: "Not applicable")
// ═══════════════════════════════════════════════════════════════════

describe("APG Meter: No keyboard interaction", () => {
  it("Arrow keys do NOT change meter value", () => {
    const t = meterFactory(50);

    t.keyboard.press("ArrowRight");
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(50);

    t.keyboard.press("ArrowLeft");
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(50);

    t.keyboard.press("ArrowUp");
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(50);

    t.keyboard.press("ArrowDown");
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(50);
  });

  it("Home/End do NOT change meter value", () => {
    const t = meterFactory(50);

    t.keyboard.press("Home");
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(50);

    t.keyboard.press("End");
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(50);
  });

  it("PageUp/PageDown do NOT change meter value", () => {
    const t = meterFactory(50);

    t.keyboard.press("PageUp");
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(50);

    t.keyboard.press("PageDown");
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Custom min/max range
// ═══════════════════════════════════════════════════════════════════

describe("APG Meter: Custom min/max range", () => {
  function customRangeFactory(value = 2.5) {
    const page = createOsPage();
    page.setItems([METER_ID]);
    page.setRole("meter-zone", "meter");
    page.setConfig({
      value: {
        min: 0,
        max: 5,
        step: 0.5,
        largeStep: 1,
      },
    });
    page.setActiveZone("meter-zone", METER_ID);
    page.setValueNow(METER_ID, value);
    return page;
  }

  it("custom range: aria-valuemin reflects configured min", () => {
    const t = customRangeFactory(2.5);
    expect(t.attrs(METER_ID)["aria-valuemin"]).toBe(0);
  });

  it("custom range: aria-valuemax reflects configured max", () => {
    const t = customRangeFactory(2.5);
    expect(t.attrs(METER_ID)["aria-valuemax"]).toBe(5);
  });

  it("custom range: aria-valuenow reflects current value", () => {
    const t = customRangeFactory(3.7);
    expect(t.attrs(METER_ID)["aria-valuenow"]).toBe(3.7);
  });
});
