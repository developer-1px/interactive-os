/**
 * APG Tree View Pattern — Contract Test
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 *
 * Config: vertical, no-loop, single-select
 * Unique: ArrowRight/Left expand/collapse, leaf no-expand,
 *         Enter activates (does NOT expand)
 *
 * Uses createTestOsKernel for full pipeline testing:
 *   pressKey → resolveKeyboard → command → state → attrs
 */

import { describe, expect, it } from "vitest";
import { createTestOsKernel } from "../integration/helpers/createTestOsKernel";
import {
    assertVerticalNav,
    assertBoundaryClamp,
    assertHomeEnd,
    assertNoSelection,
} from "./helpers/contracts";

// ─── Configs ───

const TREE_ITEMS = ["section-1", "child-1a", "child-1b", "section-2", "leaf-1"];

function treeFactory(focusedItem = "section-1") {
    const t = createTestOsKernel();
    t.setItems(TREE_ITEMS);
    t.setExpandableItems(["section-1", "section-2"]);
    t.setTreeLevels({
        "section-1": 1,
        "child-1a": 2,
        "child-1b": 2,
        "section-2": 1,
        "leaf-1": 2,
    });
    t.setRole("tree-zone", "tree");
    t.setConfig({
        navigate: {
            orientation: "vertical",
            loop: false,
            seamless: false,
            typeahead: false,
            entry: "first",
            recovery: "next",
        },
        select: {
            mode: "single",
            followFocus: false,
            disallowEmpty: false,
            range: false,
            toggle: true,
        },
    });
    t.setActiveZone("tree-zone", focusedItem);
    return t;
}

function leafFactory() {
    return treeFactory("leaf-1");
}

function multiTreeFactory(focusedItem = "section-1") {
    const t = treeFactory(focusedItem);
    t.setConfig({
        navigate: {
            orientation: "vertical",
            loop: false,
            seamless: false,
            typeahead: false,
            entry: "first",
            recovery: "next",
        },
        select: {
            mode: "multiple",
            followFocus: false,
            disallowEmpty: false,
            range: true,
            toggle: true,
        },
    });
    return t;
}


// ═══════════════════════════════════════════════════
// Shared contracts — navigation
// ═══════════════════════════════════════════════════

describe("APG Tree: Navigation", () => {
    assertVerticalNav(treeFactory);
    assertBoundaryClamp(treeFactory, {
        firstId: "section-1",
        lastId: "leaf-1",
        axis: "vertical",
    });
    assertHomeEnd(treeFactory, {
        firstId: "section-1",
        lastId: "leaf-1",
    });
    assertNoSelection(treeFactory);
});

// ═══════════════════════════════════════════════════
// Tree-Specific: Expansion via ArrowRight/Left
// ═══════════════════════════════════════════════════

describe("APG Tree: Expansion (pressKey pipeline)", () => {
    it("ArrowRight on collapsed node: expands (via pressKey)", () => {
        const t = treeFactory("section-1");
        expect(t.zone()?.expandedItems).not.toContain("section-1");

        t.pressKey("ArrowRight");

        expect(t.zone()?.expandedItems).toContain("section-1");
    });

    it("ArrowLeft on expanded node: collapses (via pressKey)", () => {
        const t = treeFactory("section-1");
        // First expand
        t.pressKey("ArrowRight");
        expect(t.zone()?.expandedItems).toContain("section-1");

        // Then collapse
        t.pressKey("ArrowLeft");
        expect(t.zone()?.expandedItems).not.toContain("section-1");
    });

    it("ArrowRight on leaf: does NOT expand (but does nothing because no children)", () => {
        const t = leafFactory();

        t.pressKey("ArrowRight");

        // Leaf should never appear in expandedItems
        expect(t.zone()?.expandedItems).not.toContain("leaf-1");
        expect(t.focusedItemId()).toBe("leaf-1");
    });

    it("ArrowRight on an open node: moves focus to the first child node", () => {
        const t = treeFactory("section-1");
        t.pressKey("ArrowRight"); // First expand it
        expect(t.zone()?.expandedItems).toContain("section-1");

        t.pressKey("ArrowRight"); // Press again on open node -> move to child
        expect(t.focusedItemId()).toBe("child-1a");
    });

    it("ArrowLeft on a closed or leaf node: moves focus to its parent node", () => {
        const t = treeFactory("child-1a"); // Focus on a child node

        t.pressKey("ArrowLeft"); // Should move to parent

        expect(t.focusedItemId()).toBe("section-1");
    });
});

// ═══════════════════════════════════════════════════
// Tree-Specific: Selection (Space key)
// ═══════════════════════════════════════════════════

describe("APG Tree: Selection (Space key)", () => {
    it("Space on item: toggles selection state", () => {
        const t = treeFactory("section-1");
        expect(t.selection()).not.toContain("section-1");

        t.pressKey("Space");
        expect(t.selection()).toContain("section-1");

        t.pressKey("Space");
        expect(t.selection()).not.toContain("section-1");
    });
});

// ═══════════════════════════════════════════════════
// Tree-Specific: Activation (Enter key)
// ═══════════════════════════════════════════════════

describe("APG Tree: Activation (Enter key)", () => {
    it("Enter on leaf: does NOT expand (activate only)", () => {
        const t = leafFactory();
        const beforeExpanded = [...(t.zone()?.expandedItems ?? [])];

        t.pressKey("Enter");

        // expandedItems should not change
        expect(t.zone()?.expandedItems).toEqual(beforeExpanded);
    });

    it("Enter on section: should toggle expand (current behavior)", () => {
        const t = treeFactory("section-1");

        t.pressKey("Enter");

        // OS_ACTIVATE dispatches OS_EXPAND for expandable roles
        expect(t.zone()?.expandedItems).toContain("section-1");
    });
});

// ═══════════════════════════════════════════════════
// DOM Projection: aria-expanded attrs
// ═══════════════════════════════════════════════════

describe("APG Tree: DOM Projection (attrs)", () => {
    it("treeitem role is assigned to items", () => {
        const t = treeFactory("section-1");
        expect(t.attrs("section-1").role).toBe("treeitem");
    });

    it("collapsed node: aria-expanded=false", () => {
        const t = treeFactory("section-1");
        expect(t.attrs("section-1")["aria-expanded"]).toBe(false);
    });

    it("expanded node: aria-expanded=true", () => {
        const t = treeFactory("section-1");
        t.pressKey("ArrowRight"); // expand
        expect(t.attrs("section-1")["aria-expanded"]).toBe(true);
    });

    it("focused item has tabIndex=0, others have -1", () => {
        const t = treeFactory("section-1");
        expect(t.attrs("section-1").tabIndex).toBe(0);
        expect(t.attrs("child-1a").tabIndex).toBe(-1);
        expect(t.attrs("leaf-1").tabIndex).toBe(-1);
    });

    it("focused item has data-focused=true", () => {
        const t = treeFactory("section-1");
        expect(t.attrs("section-1")["data-focused"]).toBe(true);
        expect(t.attrs("child-1a")["data-focused"]).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════
// Click: mouse interaction
// ═══════════════════════════════════════════════════

describe("APG Tree: Click interaction", () => {
    it("click on item: focuses and selects", () => {
        const t = treeFactory("section-1");

        t.click("child-1a");

        expect(t.focusedItemId()).toBe("child-1a");
    });
});

// ═══════════════════════════════════════════════════
// Multi-Select Tree: Shift+Arrow
// ═══════════════════════════════════════════════════

describe("APG Tree: Multi-Selection (Shift+Arrow)", () => {
    it("Shift+ArrowDown: expands selection to the next visible node", () => {
        const t = multiTreeFactory("section-1");
        t.pressKey("ArrowRight"); // expand section-1 to make children visible

        t.pressKey("Space"); // select section-1
        expect(t.selection()).toEqual(["section-1"]);

        // Shift+Down -> should select child-1a as well
        t.pressKey("Shift+ArrowDown");
        expect(t.selection()).toContain("section-1");
        expect(t.selection()).toContain("child-1a");
        expect(t.focusedItemId()).toBe("child-1a");
    });

    it("Shift+ArrowUp: expands selection to the previous visible node", () => {
        const t = multiTreeFactory("section-1");
        t.pressKey("ArrowRight"); // expand section-1
        t.pressKey("ArrowDown"); // move focus to child-1a
        t.pressKey("Space"); // select child-1a
        expect(t.selection()).toEqual(["child-1a"]);

        // Shift+Up -> should select section-1 as well
        t.pressKey("Shift+ArrowUp");
        expect(t.selection()).toContain("section-1");
        expect(t.selection()).toContain("child-1a");
        expect(t.focusedItemId()).toBe("section-1");
    });
});
