/**
 * Navigation Tree (Finder-like) — Contract Test
 *
 * Config: activate.onClick: true, select.followFocus: true
 *
 * Navigation Tree differs from Application Tree:
 *   - Click on folder → OS_ACTIVATE → OS_EXPAND (toggle)
 *   - Click on file → OS_ACTIVATE → onAction (navigate)
 *   - Arrow to file → followFocus selects → onSelect fires
 *   - Arrow to folder → followFocus selects → onSelect fires (app decides to skip)
 *   - Enter on folder → OS_ACTIVATE → OS_EXPAND
 *   - Enter on file → OS_ACTIVATE → onAction
 *
 * Uses createOsPage for full pipeline testing.
 */

import { describe, expect, it, vi } from "vitest";
import { createOsPage } from "@os/createOsPage";

// ─── Configs ───

const NAV_ITEMS = ["folder:docs", "file:readme", "file:guide", "folder:src", "file:index"];

function navTreeFactory(focusedItem = "folder:docs") {
    const page = createOsPage();
    page.setItems(NAV_ITEMS);
    page.setExpandableItems(["folder:docs", "folder:src"]);
    page.setTreeLevels({
        "folder:docs": 1,
        "file:readme": 2,
        "file:guide": 2,
        "folder:src": 1,
        "file:index": 2,
    });
    page.setRole("nav-tree", "tree");
    page.setConfig({
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
            followFocus: true,
            disallowEmpty: false,
            range: false,
            toggle: false,
        },
        activate: {
            onClick: true,
        },
    });
    page.setActiveZone("nav-tree", focusedItem);
    return page;
}

// ═══════════════════════════════════════════════════
// followFocus: Arrow keys auto-select
// ═══════════════════════════════════════════════════

describe("Navigation Tree: followFocus", () => {
    it("ArrowDown moves focus AND selects the next item", () => {
        const t = navTreeFactory("folder:docs");

        t.keyboard.press("ArrowDown");

        expect(t.focusedItemId()).toBe("file:readme");
        expect(t.selection()).toContain("file:readme");
    });

    it("ArrowUp moves focus AND selects the previous item", () => {
        const t = navTreeFactory("file:guide");

        t.keyboard.press("ArrowUp");

        expect(t.focusedItemId()).toBe("file:readme");
        expect(t.selection()).toContain("file:readme");
    });

    it("multiple ArrowDown: selection follows focus (single-select)", () => {
        const t = navTreeFactory("folder:docs");

        t.keyboard.press("ArrowDown");
        expect(t.selection()).toEqual(["file:readme"]);

        t.keyboard.press("ArrowDown");
        expect(t.selection()).toEqual(["file:guide"]);
        expect(t.focusedItemId()).toBe("file:guide");
    });
});

// ═══════════════════════════════════════════════════
// Expansion: folders expand/collapse
// ═══════════════════════════════════════════════════

describe("Navigation Tree: Expansion", () => {
    it("ArrowRight on collapsed folder → expands", () => {
        const t = navTreeFactory("folder:docs");
        expect(t.zone()?.expandedItems).not.toContain("folder:docs");

        t.keyboard.press("ArrowRight");
        expect(t.zone()?.expandedItems).toContain("folder:docs");
    });

    it("ArrowLeft on expanded folder → collapses", () => {
        const t = navTreeFactory("folder:docs");
        t.keyboard.press("ArrowRight"); // expand
        expect(t.zone()?.expandedItems).toContain("folder:docs");

        t.keyboard.press("ArrowLeft"); // collapse
        expect(t.zone()?.expandedItems).not.toContain("folder:docs");
    });

    it("Enter on folder → toggles expansion (not navigation)", () => {
        const t = navTreeFactory("folder:docs");

        t.keyboard.press("Enter");
        expect(t.zone()?.expandedItems).toContain("folder:docs");

        t.keyboard.press("Enter");
        expect(t.zone()?.expandedItems).not.toContain("folder:docs");
    });

    it("ArrowRight on file → does NOT expand", () => {
        const t = navTreeFactory("file:readme");

        t.keyboard.press("ArrowRight");
        expect(t.zone()?.expandedItems).not.toContain("file:readme");
    });
});

// ═══════════════════════════════════════════════════
// Activation: Enter on file
// ═══════════════════════════════════════════════════

describe("Navigation Tree: Activation", () => {
    it("Enter on file → does NOT expand (no expandedItems change)", () => {
        const t = navTreeFactory("file:readme");
        const before = [...(t.zone()?.expandedItems ?? [])];

        t.keyboard.press("Enter");

        expect(t.zone()?.expandedItems).toEqual(before);
    });
});

// ═══════════════════════════════════════════════════
// aria-expanded: only folders get it
// ═══════════════════════════════════════════════════

describe("Navigation Tree: DOM Projection", () => {
    it("folder has aria-expanded=false when collapsed", () => {
        const t = navTreeFactory("folder:docs");
        expect(t.attrs("folder:docs")["aria-expanded"]).toBe(false);
    });

    it("folder has aria-expanded=true when expanded", () => {
        const t = navTreeFactory("folder:docs");
        t.keyboard.press("ArrowRight");
        expect(t.attrs("folder:docs")["aria-expanded"]).toBe(true);
    });

    it("file does NOT have aria-expanded", () => {
        const t = navTreeFactory("file:readme");
        expect(t.attrs("file:readme")["aria-expanded"]).toBeUndefined();
    });

    it("focused item has tabIndex=0, others -1", () => {
        const t = navTreeFactory("folder:docs");
        expect(t.attrs("folder:docs").tabIndex).toBe(0);
        expect(t.attrs("file:readme").tabIndex).toBe(-1);
    });
});
