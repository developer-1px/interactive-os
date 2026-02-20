/**
 * APG Toolbar Pattern — Contract Test (Headless Kernel)
 *
 * Source of Truth: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 *
 * Verifies that the Interaction OS satisfies the W3C APG Toolbar
 * keyboard interaction contract using headless kernel dispatch.
 *
 * Toolbar is a horizontal widget with roving tabindex:
 *   - Left/Right arrows move between controls
 *   - Tab moves focus OUT of the toolbar to the next zone
 *   - On re-entry, focus restores to the last focused control
 *
 * Structure:
 *   1. Horizontal Navigation (←→)
 *   2. Vertical Ignored (↑↓ do nothing)
 *   3. Tab Escape (focus exits toolbar)
 *   4. Focus Restore on Re-entry
 *   5. Home / End
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "../integration/helpers/createTestKernel";

// ─── Helpers ───

const TOOLBAR_ITEMS = ["bold-btn", "italic-btn", "underline-btn", "link-btn"];

/** Toolbar config: horizontal, Tab escapes, restore on re-entry */
const TOOLBAR_CONFIG = {
    navigate: {
        orientation: "horizontal" as const,
        loop: true,
        seamless: false,
        typeahead: false,
        entry: "restore" as const,
        recovery: "next" as const,
    },
    select: {
        mode: "none" as const,
        followFocus: false,
        disallowEmpty: false,
        range: false,
        toggle: false,
    },
    tab: {
        behavior: "escape" as const,
        restoreFocus: false,
    },
};

function createToolbar(focusedItem = "bold-btn") {
    const t = createTestKernel();
    t.setItems(TOOLBAR_ITEMS);
    t.setConfig(TOOLBAR_CONFIG);
    t.setActiveZone("toolbar", focusedItem);
    return t;
}

// ═══════════════════════════════════════════════════════════════════
// 1. APG Toolbar: Horizontal Navigation
//    "Right Arrow: Moves focus to the next control."
//    "Left Arrow: Moves focus to the previous control."
//    "Optionally, focus movement may wrap."
// ═══════════════════════════════════════════════════════════════════

describe("APG Toolbar: Horizontal Navigation", () => {
    it("Right Arrow: moves focus to next control", () => {
        const t = createToolbar("bold-btn");

        t.dispatch(t.NAVIGATE({ direction: "right" }));

        expect(t.focusedItemId()).toBe("italic-btn");
    });

    it("Left Arrow: moves focus to previous control", () => {
        const t = createToolbar("underline-btn");

        t.dispatch(t.NAVIGATE({ direction: "left" }));

        expect(t.focusedItemId()).toBe("italic-btn");
    });

    it("Right Arrow at last: wraps to first (loop=true)", () => {
        const t = createToolbar("link-btn");

        t.dispatch(t.NAVIGATE({ direction: "right" }));

        expect(t.focusedItemId()).toBe("bold-btn"); // wrapped
    });

    it("Left Arrow at first: wraps to last (loop=true)", () => {
        const t = createToolbar("bold-btn");

        t.dispatch(t.NAVIGATE({ direction: "left" }));

        expect(t.focusedItemId()).toBe("link-btn"); // wrapped
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. APG Toolbar: Vertical Ignored
//    "[For horizontal toolbar] Up/Down do nothing"
// ═══════════════════════════════════════════════════════════════════

describe("APG Toolbar: Vertical Keys Ignored", () => {
    it("Down Arrow: no effect in horizontal toolbar", () => {
        const t = createToolbar("italic-btn");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("italic-btn"); // unchanged
    });

    it("Up Arrow: no effect in horizontal toolbar", () => {
        const t = createToolbar("italic-btn");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("italic-btn"); // unchanged
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. APG Toolbar: Tab Escape
//    "Tab and Shift+Tab: Move focus into and out of the toolbar."
// ═══════════════════════════════════════════════════════════════════

describe("APG Toolbar: Tab Escape", () => {
    it("Tab: moves focus out of toolbar to next zone", () => {
        const t = createToolbar("italic-btn");
        t.setZoneOrder([
            {
                zoneId: "toolbar",
                firstItemId: "bold-btn",
                lastItemId: "link-btn",
                entry: "restore",
                selectedItemId: null,
                lastFocusedId: "italic-btn",
            },
            {
                zoneId: "editor",
                firstItemId: "line-1",
                lastItemId: "line-10",
                entry: "first",
                selectedItemId: null,
                lastFocusedId: null,
            },
        ]);

        t.dispatch(t.TAB({ direction: "forward" }));

        expect(t.activeZoneId()).toBe("editor");
        expect(t.focusedItemId("editor")).toBe("line-1");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 4. APG Toolbar: Home / End
//    "Home: Moves focus to first element."
//    "End: Moves focus to last element."
// ═══════════════════════════════════════════════════════════════════

describe("APG Toolbar: Home / End", () => {
    it("Home: moves focus to first control", () => {
        const t = createToolbar("underline-btn");

        t.dispatch(t.NAVIGATE({ direction: "home" }));

        expect(t.focusedItemId()).toBe("bold-btn");
    });

    it("End: moves focus to last control", () => {
        const t = createToolbar("italic-btn");

        t.dispatch(t.NAVIGATE({ direction: "end" }));

        expect(t.focusedItemId()).toBe("link-btn");
    });
});
