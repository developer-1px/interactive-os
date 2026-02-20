/**
 * APG Tabs Pattern — Contract Test (Headless Kernel)
 *
 * Source of Truth: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * Tabs = horizontal roving tabindex (like Toolbar), but with:
 *   - Left/Right arrows move between tabs
 *   - Selection follows focus (automatic activation)
 *   - Optional: loop / no-loop
 *   - Tab key exits the tablist to the panel
 *
 * Structure:
 *   1. Horizontal Navigation (←→)
 *   2. Selection Follows Focus (automatic activation)
 *   3. Vertical Keys Ignored
 *   4. Home / End
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "../integration/helpers/createTestKernel";

// ─── Helpers ───

const TAB_ITEMS = ["tab-general", "tab-security", "tab-advanced"];

/** Tabs config: horizontal, automatic activation (followFocus=true) */
const TABS_CONFIG = {
    navigate: {
        orientation: "horizontal" as const,
        loop: true,
        seamless: false,
        typeahead: false,
        entry: "first" as const,
        recovery: "next" as const,
    },
    select: {
        mode: "single" as const,
        followFocus: true,
        disallowEmpty: true,
        range: false,
        toggle: false,
    },
    tab: {
        behavior: "escape" as const,
        restoreFocus: false,
    },
};

function createTabs(focusedTab = "tab-general") {
    const t = createTestKernel();
    t.setItems(TAB_ITEMS);
    t.setConfig(TABS_CONFIG);
    t.setActiveZone("tablist", focusedTab);
    t.dispatch(t.SELECT({ targetId: focusedTab, mode: "replace" }));
    return t;
}

// ═══════════════════════════════════════════════════════════════════
// 1. APG Tabs: Horizontal Navigation
//    "Right Arrow: moves focus to the next tab."
//    "Left Arrow: moves focus to the previous tab."
// ═══════════════════════════════════════════════════════════════════

describe("APG Tabs: Horizontal Navigation", () => {
    it("Right Arrow: moves focus to next tab", () => {
        const t = createTabs("tab-general");

        t.dispatch(t.NAVIGATE({ direction: "right" }));

        expect(t.focusedItemId()).toBe("tab-security");
    });

    it("Left Arrow: moves focus to previous tab", () => {
        const t = createTabs("tab-security");

        t.dispatch(t.NAVIGATE({ direction: "left" }));

        expect(t.focusedItemId()).toBe("tab-general");
    });

    it("Right at last: wraps to first (loop=true)", () => {
        const t = createTabs("tab-advanced");

        t.dispatch(t.NAVIGATE({ direction: "right" }));

        expect(t.focusedItemId()).toBe("tab-general");
    });

    it("Left at first: wraps to last (loop=true)", () => {
        const t = createTabs("tab-general");

        t.dispatch(t.NAVIGATE({ direction: "left" }));

        expect(t.focusedItemId()).toBe("tab-advanced");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. APG Tabs: Automatic Activation
//    "When automatic activation is used, the tab panel is displayed
//     when the tab receives focus."
// ═══════════════════════════════════════════════════════════════════

describe("APG Tabs: Automatic Activation (followFocus)", () => {
    it("navigating right activates (selects) the new tab", () => {
        const t = createTabs("tab-general");

        t.dispatch(t.NAVIGATE({ direction: "right" }));

        expect(t.focusedItemId()).toBe("tab-security");
        expect(t.selection()).toEqual(["tab-security"]); // auto-activated
    });

    it("full cycle: selection follows each navigation", () => {
        const t = createTabs("tab-general");

        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.selection()).toEqual(["tab-security"]);

        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.selection()).toEqual(["tab-advanced"]);

        t.dispatch(t.NAVIGATE({ direction: "right" })); // wrap
        expect(t.selection()).toEqual(["tab-general"]);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. APG Tabs: Vertical Keys Ignored
// ═══════════════════════════════════════════════════════════════════

describe("APG Tabs: Vertical Keys Ignored", () => {
    it("Down Arrow: no effect", () => {
        const t = createTabs("tab-security");
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("tab-security");
    });

    it("Up Arrow: no effect", () => {
        const t = createTabs("tab-security");
        t.dispatch(t.NAVIGATE({ direction: "up" }));
        expect(t.focusedItemId()).toBe("tab-security");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 4. APG Tabs: Home / End
//    "Home: moves focus to first tab."
//    "End: moves focus to last tab."
// ═══════════════════════════════════════════════════════════════════

describe("APG Tabs: Home / End", () => {
    it("Home: moves to first tab + activates", () => {
        const t = createTabs("tab-advanced");

        t.dispatch(t.NAVIGATE({ direction: "home" }));

        expect(t.focusedItemId()).toBe("tab-general");
        expect(t.selection()).toEqual(["tab-general"]);
    });

    it("End: moves to last tab + activates", () => {
        const t = createTabs("tab-general");

        t.dispatch(t.NAVIGATE({ direction: "end" }));

        expect(t.focusedItemId()).toBe("tab-advanced");
        expect(t.selection()).toEqual(["tab-advanced"]);
    });
});
