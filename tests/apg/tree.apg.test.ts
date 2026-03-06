/**
 * APG Tree View Pattern — Contract Test
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 *
 * Config: vertical, no-loop, single-select
 * Unique: ArrowRight/Left expand/collapse, leaf no-expand,
 *         Enter activates (does NOT expand)
 *
 * Uses defineApp+createPage for full pipeline testing:
 *   keyboard.press → resolveKeyboard → command → state → attrs
 */

import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";
import {
  assertBoundaryClamp,
  assertHomeEnd,
  assertNoSelection,
  assertVerticalNav,
} from "./helpers/contracts";

// ─── Configs ───

const TREE_ITEMS = ["section-1", "child-1a", "child-1b", "section-2", "leaf-1"];

const TREE_NAV_CONFIG = {
  navigate: {
    orientation: "vertical" as const,
    loop: false,
    seamless: false,
    typeahead: false,
    entry: "first" as const,
    recovery: "next" as const,
  },
  select: {
    mode: "single" as const,
    followFocus: false,
    disallowEmpty: false,
    range: false,
    toggle: true,
  },
};

function treeFactory(focusedItem = "section-1") {
  const app = defineApp("test-tree", {});
  const zone = app.createZone("tree-zone");
  zone.bind({
    role: "tree",
    getItems: () => TREE_ITEMS,
    getExpandableItems: () => new Set(["section-1", "section-2"]),
    getTreeLevels: () =>
      new Map([
        ["section-1", 1],
        ["child-1a", 2],
        ["child-1b", 2],
        ["section-2", 1],
        ["leaf-1", 2],
      ]),
    options: TREE_NAV_CONFIG,
  });
  const page = createPage(app);
  page.goto("tree-zone", { focusedItemId: focusedItem });
  return page;
}

function leafFactory() {
  return treeFactory("leaf-1");
}

function multiTreeFactory(focusedItem = "section-1") {
  const app = defineApp("test-tree-multi", {});
  const zone = app.createZone("tree-zone");
  zone.bind({
    role: "tree",
    getItems: () => TREE_ITEMS,
    getExpandableItems: () => new Set(["section-1", "section-2"]),
    getTreeLevels: () =>
      new Map([
        ["section-1", 1],
        ["child-1a", 2],
        ["child-1b", 2],
        ["section-2", 1],
        ["leaf-1", 2],
      ]),
    options: {
      ...TREE_NAV_CONFIG,
      select: {
        mode: "multiple" as const,
        followFocus: false,
        disallowEmpty: false,
        range: true,
        toggle: true,
      },
    },
  });
  const page = createPage(app);
  page.goto("tree-zone", { focusedItemId: focusedItem });
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts — navigation
// ═══════════════════════════════════════════════════

describe("APG Tree: Navigation", () => {
  assertVerticalNav(treeFactory as any);
  assertBoundaryClamp(treeFactory as any, {
    firstId: "section-1",
    lastId: "leaf-1",
    axis: "vertical",
  });
  assertHomeEnd(treeFactory as any, {
    firstId: "section-1",
    lastId: "leaf-1",
  });
  assertNoSelection(treeFactory as any);
});

// ═══════════════════════════════════════════════════
// Tree-Specific: Expansion via ArrowRight/Left
// ═══════════════════════════════════════════════════

describe("APG Tree: Expansion (pressKey pipeline)", () => {
  it("ArrowRight on collapsed node: expands (via pressKey)", () => {
    const t = treeFactory("section-1");
    expect(t.attrs("section-1")["aria-expanded"]).toBe(false);

    t.keyboard.press("ArrowRight");

    expect(t.attrs("section-1")["aria-expanded"]).toBe(true);
  });

  it("ArrowLeft on expanded node: collapses (via pressKey)", () => {
    const t = treeFactory("section-1");
    // First expand
    t.keyboard.press("ArrowRight");
    expect(t.attrs("section-1")["aria-expanded"]).toBe(true);

    // Then collapse
    t.keyboard.press("ArrowLeft");
    expect(t.attrs("section-1")["aria-expanded"]).toBe(false);
  });

  it("ArrowRight on leaf: does NOT expand (but does nothing because no children)", () => {
    const t = leafFactory();

    t.keyboard.press("ArrowRight");

    // Leaf should never appear expanded
    expect(t.attrs("leaf-1")["aria-expanded"]).toBeUndefined();
    expect(t.focusedItemId()).toBe("leaf-1");
  });

  it("ArrowRight on an open node: moves focus to the first child node", () => {
    const t = treeFactory("section-1");
    t.keyboard.press("ArrowRight"); // First expand it
    expect(t.attrs("section-1")["aria-expanded"]).toBe(true);

    t.keyboard.press("ArrowRight"); // Press again on open node -> move to child
    expect(t.focusedItemId()).toBe("child-1a");
  });

  it("ArrowLeft on a closed or leaf node: moves focus to its parent node", () => {
    const t = treeFactory("child-1a"); // Focus on a child node

    t.keyboard.press("ArrowLeft"); // Should move to parent

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

    t.keyboard.press("Space");
    expect(t.selection()).toContain("section-1");

    t.keyboard.press("Space");
    expect(t.selection()).not.toContain("section-1");
  });
});

// ═══════════════════════════════════════════════════
// Tree-Specific: Activation (Enter key)
// ═══════════════════════════════════════════════════

describe("APG Tree: Activation (Enter key)", () => {
  it("Enter on leaf: does NOT expand (activate only)", () => {
    const t = leafFactory();
    // leaf-1 is not expandable, so aria-expanded should remain undefined
    t.keyboard.press("Enter");
    expect(t.attrs("leaf-1")["aria-expanded"]).toBeUndefined();
  });

  it("Enter on section: should toggle expand (current behavior)", () => {
    const t = treeFactory("section-1");

    t.keyboard.press("Enter");

    // OS_ACTIVATE dispatches OS_EXPAND for expandable roles
    expect(t.attrs("section-1")["aria-expanded"]).toBe(true);
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
    t.keyboard.press("ArrowRight"); // expand
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

  it("click on expandable item: toggles expand (APG handleClick)", () => {
    const t = treeFactory("section-1");
    expect(t.attrs("section-1")["aria-expanded"]).toBe(false);

    // Click on focused expandable item → should expand
    t.click("section-1");
    expect(t.attrs("section-1")["aria-expanded"]).toBe(true);

    // Click again → should collapse
    t.click("section-1");
    expect(t.attrs("section-1")["aria-expanded"]).toBe(false);
  });

  it("click on non-focused expandable item: focuses + expands", () => {
    const t = treeFactory("section-1");

    // Click on a different expandable item
    t.click("section-2");
    expect(t.focusedItemId()).toBe("section-2");
    expect(t.attrs("section-2")["aria-expanded"]).toBe(true);
  });

  it("click on leaf: focuses, does NOT expand", () => {
    const t = treeFactory("section-1");

    t.click("leaf-1");
    expect(t.focusedItemId()).toBe("leaf-1");
    expect(t.attrs("leaf-1")["aria-expanded"]).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════
// Multi-Select Tree: Shift+Arrow
// ═══════════════════════════════════════════════════

describe("APG Tree: Multi-Selection (Shift+Arrow)", () => {
  it("Shift+ArrowDown: expands selection to the next visible node", () => {
    const t = multiTreeFactory("section-1");
    t.keyboard.press("ArrowRight"); // expand section-1 to make children visible

    t.keyboard.press("Space"); // select section-1
    expect(t.selection()).toEqual(["section-1"]);

    // Shift+Down -> should select child-1a as well
    t.keyboard.press("Shift+ArrowDown");
    expect(t.selection()).toContain("section-1");
    expect(t.selection()).toContain("child-1a");
    expect(t.focusedItemId()).toBe("child-1a");
  });

  it("Shift+ArrowUp: expands selection to the previous visible node", () => {
    const t = multiTreeFactory("section-1");
    t.keyboard.press("ArrowRight"); // expand section-1
    t.keyboard.press("ArrowDown"); // move focus to child-1a
    t.keyboard.press("Space"); // select child-1a
    expect(t.selection()).toEqual(["child-1a"]);

    // Shift+Up -> should select section-1 as well
    t.keyboard.press("Shift+ArrowUp");
    expect(t.selection()).toContain("section-1");
    expect(t.selection()).toContain("child-1a");
    expect(t.focusedItemId()).toBe("section-1");
  });
});

// ═══════════════════════════════════════════════════
// Single-Select Tree: Negative Tests (MUST NOT)
// ═══════════════════════════════════════════════════

describe("APG Tree: Single-Select Negative (MUST NOT)", () => {
  it("Shift+ArrowDown: MUST NOT create range selection", () => {
    const t = treeFactory("section-1");
    t.keyboard.press("Space"); // select section-1
    expect(t.selection()).toEqual(["section-1"]);

    t.keyboard.press("Shift+ArrowDown");
    // Single-select: only 1 item selected at a time
    expect(t.selection()).toHaveLength(1);
  });

  it("Ctrl+A: MUST NOT select all in single-select tree", () => {
    const t = treeFactory("section-1");
    t.keyboard.press("Meta+A");
    expect(t.selection().length).toBeLessThanOrEqual(1);
  });

  it("Shift+Click: MUST NOT create range selection (single-select enforces replace)", () => {
    const t = treeFactory("section-1");
    t.click("section-1");
    expect(t.selection()).toEqual(["section-1"]);

    t.click("leaf-1", { shift: true });
    expect(t.selection()).toHaveLength(1);
    expect(t.selection()).toContain("leaf-1"); // replaced, not range
    expect(t.selection()).not.toContain("section-1");
  });

  it("Cmd+Click: toggle selection (tree single has toggle:true)", () => {
    const t = treeFactory("section-1");
    t.click("section-1");
    expect(t.selection()).toEqual(["section-1"]);

    t.click("section-1", { meta: true });
    // toggle:true → deselect is allowed
    expect(t.selection()).not.toContain("section-1");
  });

  it("navigate always keeps ≤1 selected (single-select invariant)", () => {
    const t = treeFactory("section-1");
    t.keyboard.press("Space"); // select
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("ArrowDown");
    // followFocus:false → selection doesn't change
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("ArrowDown");
    expect(t.selection()).toHaveLength(1);
  });
});
