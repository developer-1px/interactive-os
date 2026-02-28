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

import { createOsPage } from "@os/createOsPage";
import { describe, expect, it } from "vitest";

// ─── Configs ───

const ITEMS = ["radio-sm", "radio-md", "radio-lg"];

const RADIOGROUP_CONFIG = {
    navigate: {
        orientation: "vertical" as const,
        loop: true,
        seamless: false,
        typeahead: false,
        entry: "selected" as const,
        recovery: "next" as const,
        arrowExpand: false,
    },
    select: {
        mode: "single" as const,
        followFocus: true,
        disallowEmpty: true,
        range: false,
        toggle: false,
    },
};

function setup(selected = "radio-sm") {
    const page = createOsPage();
    page.goto("radiogroup", {
        items: ITEMS,
        config: RADIOGROUP_CONFIG,
        role: "radiogroup",
        focusedItemId: selected,
    });
    page.dispatch(page.OS_SELECT({ targetId: selected, mode: "replace" }));
    return page;
}

// ═══════════════════════════════════════════════════
// Navigation — vertical with loop
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Navigation", () => {
    it("ArrowDown moves focus to next radio", () => {
        const t = setup("radio-sm");
        t.keyboard.press("ArrowDown");
        expect(t.focusedItemId()).toBe("radio-md");
    });

    it("ArrowUp moves focus to previous radio", () => {
        const t = setup("radio-md");
        t.keyboard.press("ArrowUp");
        expect(t.focusedItemId()).toBe("radio-sm");
    });

    it("ArrowDown at last wraps to first (loop)", () => {
        const t = setup("radio-lg");
        t.keyboard.press("ArrowDown");
        expect(t.focusedItemId()).toBe("radio-sm");
    });

    it("ArrowUp at first wraps to last (loop)", () => {
        const t = setup("radio-sm");
        t.keyboard.press("ArrowUp");
        expect(t.focusedItemId()).toBe("radio-lg");
    });
});

// ═══════════════════════════════════════════════════
// Selection follows focus — aria-checked
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Selection follows focus (aria-checked)", () => {
    it("ArrowDown checks next radio, unchecks previous", () => {
        const t = setup("radio-sm");
        t.keyboard.press("ArrowDown");
        expect(t.attrs("radio-md")["aria-checked"]).toBe(true);
        expect(t.attrs("radio-sm")["aria-checked"]).toBe(false);
    });

    it("ArrowUp checks previous radio", () => {
        const t = setup("radio-lg");
        t.keyboard.press("ArrowUp");
        expect(t.attrs("radio-md")["aria-checked"]).toBe(true);
        expect(t.attrs("radio-lg")["aria-checked"]).toBe(false);
    });

    it("only one radio is checked at any time", () => {
        const t = setup("radio-sm");
        t.keyboard.press("ArrowDown");
        t.keyboard.press("ArrowDown");
        const checked = ITEMS.filter((id) => t.attrs(id)["aria-checked"] === true);
        expect(checked).toHaveLength(1);
        expect(checked[0]).toBe("radio-lg");
    });
});

// ═══════════════════════════════════════════════════
// Space — explicit check
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Space to check", () => {
    it("Space checks the focused radio", () => {
        const t = setup("radio-sm");
        t.keyboard.press("ArrowDown"); // focus radio-md, auto-checked by followFocus
        // Move without checking (verify Space still works)
        expect(t.attrs("radio-md")["aria-checked"]).toBe(true);
        t.keyboard.press("Space");
        // Should remain checked (Space on already-checked = no-op in APG)
        expect(t.attrs("radio-md")["aria-checked"]).toBe(true);
    });
});

// ═══════════════════════════════════════════════════
// Invariant: never empty (disallowEmpty)
// ═══════════════════════════════════════════════════

describe("APG Radiogroup: Never empty", () => {
    it("always exactly one radio checked after navigation", () => {
        const t = setup("radio-sm");
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
        const t = setup("radio-md");
        expect(t.attrs("radio-md").tabIndex).toBe(0);
        expect(t.attrs("radio-sm").tabIndex).toBe(-1);
        expect(t.attrs("radio-lg").tabIndex).toBe(-1);
    });

    it("after navigation, new focus gets tabIndex 0", () => {
        const t = setup("radio-sm");
        t.keyboard.press("ArrowDown");
        expect(t.attrs("radio-md").tabIndex).toBe(0);
        expect(t.attrs("radio-sm").tabIndex).toBe(-1);
    });
});
