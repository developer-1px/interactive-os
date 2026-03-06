/**
 * APG Meter Pattern — Contract Test (Tier 1: headless)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 *
 * Uses the ACTUAL MeterApp config from MeterPattern.tsx
 * (not a synthetic factory) to ensure headless ≡ browser.
 */

import { createPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import {
    MeterApp,
    METERS,
} from "@/pages/apg-showcase/patterns/MeterPattern";

// ─── Test Setup (actual showcase config) ───

const METER_IDS = METERS.map((m) => m.id);

function meterFactory(focusedItem = "meter-cpu") {
    const page = createPage(MeterApp);
    page.goto("apg-meter-zone", {
        items: METER_IDS,
        focusedItemId: focusedItem,
    });
    return page;
}

// ═══════════════════════════════════════════════════
// ARIA Projection
// ═══════════════════════════════════════════════════

describe("APG Meter: ARIA Projection", () => {
    it("items have role=meter", () => {
        const t = meterFactory();
        for (const id of METER_IDS) {
            expect(t.attrs(id).role).toBe("meter");
        }
    });

    it("focused item has tabIndex=0, others have tabIndex=-1", () => {
        const t = meterFactory();
        expect(t.attrs("meter-cpu").tabIndex).toBe(0);
        expect(t.attrs("meter-memory").tabIndex).toBe(-1);
        expect(t.attrs("meter-disk").tabIndex).toBe(-1);
    });

    it("focused item has data-focused=true", () => {
        const t = meterFactory();
        expect(t.attrs("meter-cpu")["data-focused"]).toBe(true);
    });

    it("aria-valuemin and aria-valuemax are projected from config", () => {
        const t = meterFactory();
        expect(t.attrs("meter-cpu")["aria-valuemin"]).toBe(0);
        expect(t.attrs("meter-cpu")["aria-valuemax"]).toBe(100);
    });

    it("initial value is projected as aria-valuenow", () => {
        const t = meterFactory();
        // Actual showcase initial: meter-cpu = 42
        expect(t.attrs("meter-cpu")["aria-valuenow"]).toBe(42);
    });
});

// ═══════════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════════

describe("APG Meter: Navigation", () => {
    it("ArrowDown moves focus to next meter", () => {
        const t = meterFactory("meter-cpu");
        t.keyboard.press("ArrowDown");
        expect(t.focusedItemId()).toBe("meter-memory");
    });

    it("ArrowUp moves focus to previous meter", () => {
        const t = meterFactory("meter-memory");
        t.keyboard.press("ArrowUp");
        expect(t.focusedItemId()).toBe("meter-cpu");
    });
});

// ═══════════════════════════════════════════════════
// Read-only: Arrow keys must NOT change meter values
// ═══════════════════════════════════════════════════

describe("APG Meter: Read-only (no value change)", () => {
    it("ArrowUp does not change meter value", () => {
        const t = meterFactory();
        const before = t.attrs("meter-cpu")["aria-valuenow"];
        t.keyboard.press("ArrowUp");
        // Focus moves, but value should not change
        expect(t.attrs("meter-cpu")["aria-valuenow"]).toBe(before);
    });

    it("ArrowDown does not change meter value", () => {
        const t = meterFactory();
        const before = t.attrs("meter-cpu")["aria-valuenow"];
        t.keyboard.press("ArrowDown");
        expect(t.attrs("meter-cpu")["aria-valuenow"]).toBe(before);
    });
});
