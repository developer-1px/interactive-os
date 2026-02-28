/**
 * APG Slider Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * W3C Slider Pattern:
 *   - role="slider" on the focusable element
 *   - aria-valuenow: current value
 *   - aria-valuemin: minimum allowed value
 *   - aria-valuemax: maximum allowed value
 *   - aria-valuetext: (optional) human-readable value text
 *   - aria-orientation: (optional) "vertical" | "horizontal" (default)
 *
 * Keyboard Interaction:
 *   - Right Arrow: increase value by one step
 *   - Up Arrow: increase value by one step
 *   - Left Arrow: decrease value by one step
 *   - Down Arrow: decrease value by one step
 *   - Home: set to minimum value
 *   - End: set to maximum value
 *   - Page Up (Optional): increase by large step
 *   - Page Down (Optional): decrease by large step
 *
 * Config: slider role, value axis with min/max/step/now
 */

import { createOsPage } from "@os/createOsPage";
import { describe, expect, it } from "vitest";

// ─── Test Setup ───

const SLIDER_ID = "volume-slider";

function sliderFactory(initialValue = 50) {
    const page = createOsPage();
    page.setItems([SLIDER_ID]);
    page.setRole("slider-zone", "slider");
    page.setConfig({
        value: {
            min: 0,
            max: 100,
            step: 1,
            largeStep: 10,
        },
    });
    page.setActiveZone("slider-zone", SLIDER_ID);
    page.setValueNow(SLIDER_ID, initialValue);
    return page;
}

// ═══════════════════════════════════════════════════════════════════
// Value Increment/Decrement via Arrow Keys
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider: Arrow Key Value Changes", () => {
    it("Right Arrow: increases value by one step", () => {
        const t = sliderFactory(50);
        t.keyboard.press("ArrowRight");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(51);
    });

    it("Up Arrow: increases value by one step", () => {
        const t = sliderFactory(50);
        t.keyboard.press("ArrowUp");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(51);
    });

    it("Left Arrow: decreases value by one step", () => {
        const t = sliderFactory(50);
        t.keyboard.press("ArrowLeft");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(49);
    });

    it("Down Arrow: decreases value by one step", () => {
        const t = sliderFactory(50);
        t.keyboard.press("ArrowDown");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(49);
    });
});

// ═══════════════════════════════════════════════════════════════════
// Boundary Clamping
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider: Boundary Clamping", () => {
    it("Right Arrow at max: value stays at max", () => {
        const t = sliderFactory(100);
        t.keyboard.press("ArrowRight");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(100);
    });

    it("Left Arrow at min: value stays at min", () => {
        const t = sliderFactory(0);
        t.keyboard.press("ArrowLeft");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// Home / End — jump to min / max
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider: Home/End", () => {
    it("Home: sets value to minimum", () => {
        const t = sliderFactory(75);
        t.keyboard.press("Home");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(0);
    });

    it("End: sets value to maximum", () => {
        const t = sliderFactory(25);
        t.keyboard.press("End");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(100);
    });
});

// ═══════════════════════════════════════════════════════════════════
// Page Up / Page Down — large step
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider: Page Up/Down (large step)", () => {
    it("Page Up: increases value by large step", () => {
        const t = sliderFactory(50);
        t.keyboard.press("PageUp");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(60);
    });

    it("Page Down: decreases value by large step", () => {
        const t = sliderFactory(50);
        t.keyboard.press("PageDown");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(40);
    });

    it("Page Up clamped at max", () => {
        const t = sliderFactory(95);
        t.keyboard.press("PageUp");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(100);
    });

    it("Page Down clamped at min", () => {
        const t = sliderFactory(5);
        t.keyboard.press("PageDown");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider: DOM Projection (attrs)", () => {
    it("slider has role=slider", () => {
        const t = sliderFactory(50);
        expect(t.attrs(SLIDER_ID).role).toBe("slider");
    });

    it("slider has aria-valuenow matching current value", () => {
        const t = sliderFactory(42);
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBe(42);
    });

    it("slider has aria-valuemin", () => {
        const t = sliderFactory(50);
        expect(t.attrs(SLIDER_ID)["aria-valuemin"]).toBe(0);
    });

    it("slider has aria-valuemax", () => {
        const t = sliderFactory(50);
        expect(t.attrs(SLIDER_ID)["aria-valuemax"]).toBe(100);
    });

    it("focused slider: tabIndex=0", () => {
        const t = sliderFactory(50);
        expect(t.attrs(SLIDER_ID).tabIndex).toBe(0);
    });

    it("focused slider: data-focused=true", () => {
        const t = sliderFactory(50);
        expect(t.attrs(SLIDER_ID)["data-focused"]).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════
// Step precision — fractional steps
// ═══════════════════════════════════════════════════════════════════

describe("APG Slider: Fractional Steps", () => {
    function fractionalFactory(initialValue = 0.5) {
        const page = createOsPage();
        page.setItems([SLIDER_ID]);
        page.setRole("slider-zone", "slider");
        page.setConfig({
            value: {
                min: 0,
                max: 1,
                step: 0.1,
                largeStep: 0.25,
            },
        });
        page.setActiveZone("slider-zone", SLIDER_ID);
        page.setValueNow(SLIDER_ID, initialValue);
        return page;
    }

    it("step=0.1: ArrowRight increments by 0.1", () => {
        const t = fractionalFactory(0.5);
        t.keyboard.press("ArrowRight");
        // Floating point: use toBeCloseTo
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBeCloseTo(0.6, 5);
    });

    it("step=0.1: ArrowLeft decrements by 0.1", () => {
        const t = fractionalFactory(0.5);
        t.keyboard.press("ArrowLeft");
        expect(t.attrs(SLIDER_ID)["aria-valuenow"]).toBeCloseTo(0.4, 5);
    });
});
