/**
 * APG Toolbar Pattern — Contract Test
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 *        + Tabs variant: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * Config: horizontal, loop, Tab=escape, select=none
 * Unique: Tab escape to next zone, vertical keys ignored
 * Tabs variant: same axis + followFocus (automatic activation)
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "../integration/helpers/createTestKernel";
import {
    assertHomeEnd,
    assertHorizontalNav,
    assertLoop,
    assertNoSelection,
    assertOrthogonalIgnored,
} from "./helpers/contracts";

// ─── Toolbar Config ───

const TOOLBAR_ITEMS = ["bold-btn", "italic-btn", "underline-btn", "link-btn"];

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
    tab: { behavior: "escape" as const, restoreFocus: false },
};

function createToolbar(focusedItem = "bold-btn") {
    const t = createTestKernel();
    t.setItems(TOOLBAR_ITEMS);
    t.setConfig(TOOLBAR_CONFIG);
    t.setActiveZone("toolbar", focusedItem);
    return t;
}

// ═══════════════════════════════════════════════════
// Shared contracts
// ═══════════════════════════════════════════════════

describe("APG Toolbar: Navigation", () => {
    assertHorizontalNav(createToolbar);
    assertLoop({
        firstId: "bold-btn",
        lastId: "link-btn",
        axis: "horizontal",
        factoryAtFirst: () => createToolbar("bold-btn"),
        factoryAtLast: () => createToolbar("link-btn"),
    });
    assertHomeEnd(createToolbar, { firstId: "bold-btn", lastId: "link-btn" });
    assertOrthogonalIgnored(createToolbar, "horizontal");
    assertNoSelection(createToolbar);
});

// ═══════════════════════════════════════════════════
// Unique: Tab Escape
// ═══════════════════════════════════════════════════

describe("APG Toolbar: Tab Escape", () => {
    it("Tab: moves focus out to next zone", () => {
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
    });
});

// ═══════════════════════════════════════════════════
// Tabs Variant (horizontal + loop + followFocus)
// Source: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
// Config delta: select.mode="single", followFocus=true, disallowEmpty=true
// ═══════════════════════════════════════════════════

describe("APG Toolbar: Tabs Variant", () => {
    const TAB_ITEMS = ["tab-general", "tab-security", "tab-advanced"];

    function createTabs(focusedTab = "tab-general") {
        const t = createTestKernel();
        t.setItems(TAB_ITEMS);
        t.setConfig({
            ...TOOLBAR_CONFIG,
            navigate: { ...TOOLBAR_CONFIG.navigate, entry: "first" as const },
            select: {
                mode: "single" as const,
                followFocus: true,
                disallowEmpty: true,
                range: false,
                toggle: false,
            },
        });
        t.setActiveZone("tablist", focusedTab);
        t.dispatch(t.SELECT({ targetId: focusedTab, mode: "replace" }));
        return t;
    }

    it("auto-activation: navigation selects tab", () => {
        const t = createTabs("tab-general");
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.focusedItemId()).toBe("tab-security");
        expect(t.selection()).toEqual(["tab-security"]);
    });

    it("full cycle: selection follows each navigation", () => {
        const t = createTabs("tab-general");
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.selection()).toEqual(["tab-security"]);
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.selection()).toEqual(["tab-advanced"]);
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.selection()).toEqual(["tab-general"]);
    });
});
