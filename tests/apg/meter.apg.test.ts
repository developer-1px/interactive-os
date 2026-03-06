/**
 * APG Meter Pattern — Contract Test (Tier 1: headless)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 *
 * W3C Meter Pattern:
 *   - role="meter" on the element
 *   - aria-valuemin, aria-valuemax, aria-valuenow
 *   - Read-only: arrow keys do NOT change value
 *   - Not interactive (no keyboard interaction defined in spec)
 *
 * ZIFT Classification: Field (readonly)
 */

import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp";
import { describe, expect, it } from "vitest";

// ─── Test Setup ───

const METER_IDS = ["meter-cpu", "meter-memory", "meter-disk"];

function meterFactory(focusedItem = "meter-cpu") {
    const app = defineApp("test-meter", {});
    const zone = app.createZone("meter-zone");
    zone.bind({
        role: "meter",
        getItems: () => METER_IDS,
        options: {
            navigate: { orientation: "vertical" },
        },
    });
    const page = createPage(app);
    page.goto("meter-zone", { focusedItemId: focusedItem });
    return page;
}

// ═══════════════════════════════════════════════════
// ARIA Projection
// ═══════════════════════════════════════════════════

describe("APG Meter: ARIA Projection", () => {
    it("items have role=meter", () => {
        const t = meterFactory();
        expect(t.attrs("meter-cpu").role).toBe("meter");
        expect(t.attrs("meter-memory").role).toBe("meter");
        expect(t.attrs("meter-disk").role).toBe("meter");
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
});

// ═══════════════════════════════════════════════════
// Read-only: Arrow keys must NOT change meter values
// ═══════════════════════════════════════════════════

describe("APG Meter: Read-only (no value change)", () => {
    it("ArrowUp does not change meter value", () => {
        const t = meterFactory();
        const before = t.attrs("meter-cpu")["aria-valuenow"];
        t.keyboard.press("ArrowUp");
        expect(t.attrs("meter-cpu")["aria-valuenow"]).toBe(before);
    });

    it("ArrowDown does not change meter value", () => {
        const t = meterFactory();
        const before = t.attrs("meter-cpu")["aria-valuenow"];
        t.keyboard.press("ArrowDown");
        expect(t.attrs("meter-cpu")["aria-valuenow"]).toBe(before);
    });
});
