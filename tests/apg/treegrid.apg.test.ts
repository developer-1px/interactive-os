/**
 * APG Treegrid Pattern -- Contract Test
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/
 *
 * ZIFT Classification: Zone (grid + tree hybrid)
 *   - 2D hierarchical data grid with expandable rows
 *   - Rows are the primary focusable items (row-first model)
 *   - ArrowRight/Left expand/collapse parent rows
 *   - ArrowDown/Up navigate between visible rows
 *   - Enter toggles expand on parent rows
 *
 *         loop=false, select.mode="multiple", expand.mode="explicit"
 *
 * W3C Keyboard Interaction Coverage:
 *   N1-N2: Down/Up Arrow -- moves focus between visible rows
 *   N3: Right Arrow on collapsed row -- expands
 *   N4: Right Arrow on expanded row -- moves to first child
 *   N5: Left Arrow on expanded row -- collapses
 *   N6: Left Arrow on child row -- moves to parent
 *   N7-N8: Home/End -- first/last visible row
 *   E1: Enter on parent row -- toggles expand
 *   A1-A2: ARIA roles, tabIndex, aria-expanded
 *   C1: Click interaction
 */

import { createHeadlessPage } from "@os-devtool/testing/page";
import { describe, expect, it } from "vitest";
import { TreegridApp } from "@/pages/apg-showcase/patterns/TreegridPattern";
import {
  assertBoundaryClamp,
  assertHomeEnd,
  assertNoSelection,
  assertVerticalNav,
} from "./helpers/contracts";

// -- Email inbox treegrid data (W3C APG example-inspired) --
// Flat item list = visible rows only. Parent rows are expandable.
// Thread 1: msg-1 (parent), msg-1a (reply), msg-1b (reply)
// Thread 2: msg-2 (parent), msg-2a (reply)
// Thread 3: msg-3 (standalone, no children)

const ALL_ROWS = ["msg-1", "msg-1a", "msg-1b", "msg-2", "msg-2a", "msg-3"];

const EXPANDABLE = new Set(["msg-1", "msg-2"]);

const TREE_LEVELS = new Map([
  ["msg-1", 1],
  ["msg-1a", 2],
  ["msg-1b", 2],
  ["msg-2", 1],
  ["msg-2a", 2],
  ["msg-3", 1],
]);

function treegridFactory(focusedItem = "msg-1") {
  const page = createHeadlessPage(TreegridApp);
  page.setupZone("apg-treegrid", {
    items: ALL_ROWS,
    focusedItemId: focusedItem,
    expandableItems: EXPANDABLE,
    treeLevels: TREE_LEVELS,
  });
  return page;
}

// ===============================================
// N1-N2: Vertical Navigation (Down/Up)
// W3C: "Down Arrow moves focus one row down"
// W3C: "Up Arrow moves focus one row up"
// ===============================================

describe("APG Treegrid: Vertical Navigation (N1-N2)", () => {
  assertVerticalNav(treegridFactory);
  assertBoundaryClamp(treegridFactory, {
    firstId: "msg-1",
    lastId: "msg-3",
    axis: "vertical",
  });
  assertHomeEnd(treegridFactory, {
    firstId: "msg-1",
    lastId: "msg-3",
  });
  assertNoSelection(treegridFactory);
});

// ===============================================
// N3-N4: Right Arrow -- Expand / Navigate to child
// W3C: "Right Arrow on collapsed row: opens child rows"
// W3C: "Right Arrow on expanded row: moves focus to first child"
// ===============================================

describe("APG Treegrid: Right Arrow Expand/Navigate (N3-N4)", () => {
  it("N3: Right Arrow on collapsed parent row -- expands", () => {
    const t = treegridFactory("msg-1");
    expect(t.attrs("msg-1")["aria-expanded"]).toBe(false);

    t.keyboard.press("ArrowRight");

    expect(t.attrs("msg-1")["aria-expanded"]).toBe(true);
    // Focus stays on the parent row after expansion
    expect(t.focusedItemId()).toBe("msg-1");
  });

  it("N4: Right Arrow on expanded parent row -- moves to first child", () => {
    const t = treegridFactory("msg-1");
    t.keyboard.press("ArrowRight"); // expand
    expect(t.attrs("msg-1")["aria-expanded"]).toBe(true);

    t.keyboard.press("ArrowRight"); // navigate to first child
    expect(t.focusedItemId()).toBe("msg-1a");
  });

  it("Right Arrow on leaf row (no children) -- does nothing", () => {
    const t = treegridFactory("msg-3");

    t.keyboard.press("ArrowRight");

    expect(t.focusedItemId()).toBe("msg-3");
    expect(t.attrs("msg-3")["aria-expanded"]).toBeUndefined();
  });
});

// ===============================================
// N5-N6: Left Arrow -- Collapse / Navigate to parent
// W3C: "Left Arrow on expanded row: collapses"
// W3C: "Left Arrow on child row: moves focus to parent"
// ===============================================

describe("APG Treegrid: Left Arrow Collapse/Navigate (N5-N6)", () => {
  it("N5: Left Arrow on expanded parent row -- collapses", () => {
    const t = treegridFactory("msg-1");
    t.keyboard.press("ArrowRight"); // expand first
    expect(t.attrs("msg-1")["aria-expanded"]).toBe(true);

    t.keyboard.press("ArrowLeft");

    expect(t.attrs("msg-1")["aria-expanded"]).toBe(false);
    expect(t.focusedItemId()).toBe("msg-1");
  });

  it("N6: Left Arrow on child row -- moves to parent", () => {
    const t = treegridFactory("msg-1a");

    t.keyboard.press("ArrowLeft");

    expect(t.focusedItemId()).toBe("msg-1");
  });

  it("Left Arrow on top-level leaf -- stays (no parent to navigate to)", () => {
    const t = treegridFactory("msg-3");

    t.keyboard.press("ArrowLeft");

    // msg-3 is at level 1 with no expandable parent above
    expect(t.focusedItemId()).toBe("msg-3");
  });
});

// ===============================================
// E1: Enter -- Toggle expand on parent rows
// W3C: "Enter: opens/closes child rows"
// ===============================================

describe("APG Treegrid: Enter toggles expansion (E1)", () => {
  it("Enter on collapsed parent -- expands", () => {
    const t = treegridFactory("msg-1");
    expect(t.attrs("msg-1")["aria-expanded"]).toBe(false);

    t.keyboard.press("Enter");

    expect(t.attrs("msg-1")["aria-expanded"]).toBe(true);
  });

  it("Enter on expanded parent -- collapses", () => {
    const t = treegridFactory("msg-1");
    t.keyboard.press("Enter"); // expand
    expect(t.attrs("msg-1")["aria-expanded"]).toBe(true);

    t.keyboard.press("Enter"); // collapse

    expect(t.attrs("msg-1")["aria-expanded"]).toBe(false);
  });

  it("Enter on leaf -- does NOT expand (no children)", () => {
    const t = treegridFactory("msg-3");

    t.keyboard.press("Enter");

    expect(t.attrs("msg-3")["aria-expanded"]).toBeUndefined();
  });
});

// ===============================================
// S1: Space -- Selection toggle
// W3C: "Space: selects row"
// ===============================================

describe("APG Treegrid: Selection (Space)", () => {
  it("Space toggles selection on focused row", () => {
    const t = treegridFactory("msg-1");
    expect(t.selection()).not.toContain("msg-1");

    t.keyboard.press("Space");
    expect(t.selection()).toContain("msg-1");

    t.keyboard.press("Space");
    expect(t.selection()).not.toContain("msg-1");
  });
});

// ===============================================
// S2: Shift+Arrow extends selection range
// W3C: "Shift+Arrow: extends selection"
// ===============================================

describe("APG Treegrid: Shift+Arrow selection range (S2)", () => {
  it("Shift+ArrowDown extends selection to next row", () => {
    const t = treegridFactory("msg-1");
    t.keyboard.press("Space"); // select msg-1
    expect(t.selection()).toEqual(["msg-1"]);

    t.keyboard.press("Shift+ArrowDown");
    expect(t.selection()).toContain("msg-1");
    expect(t.selection()).toContain("msg-1a");
    expect(t.focusedItemId()).toBe("msg-1a");
  });

  it("Shift+ArrowUp extends selection to previous row", () => {
    const t = treegridFactory("msg-1a");
    t.keyboard.press("Space"); // select msg-1a
    expect(t.selection()).toEqual(["msg-1a"]);

    t.keyboard.press("Shift+ArrowUp");
    expect(t.selection()).toContain("msg-1");
    expect(t.selection()).toContain("msg-1a");
    expect(t.focusedItemId()).toBe("msg-1");
  });
});

// ===============================================
// A1-A2: ARIA Roles, States, Properties
// W3C: "Each row has role=row"
// W3C: "aria-expanded on parent rows"
// ===============================================

describe("APG Treegrid: ARIA Projection (A1-A2)", () => {
  it("A1: items have role=row", () => {
    const t = treegridFactory();
    expect(t.attrs("msg-1").role).toBe("row");
    expect(t.attrs("msg-3").role).toBe("row");
  });

  it("A2: focused item has tabIndex=0, others -1", () => {
    const t = treegridFactory("msg-1");
    expect(t.attrs("msg-1").tabIndex).toBe(0);
    expect(t.attrs("msg-1a").tabIndex).toBe(-1);
    expect(t.attrs("msg-3").tabIndex).toBe(-1);
  });

  it("A3: focused item has data-focused=true", () => {
    const t = treegridFactory("msg-1");
    expect(t.attrs("msg-1")["data-focused"]).toBe(true);
    expect(t.attrs("msg-1a")["data-focused"]).toBeUndefined();
  });

  it("A4: collapsed parent -- aria-expanded=false", () => {
    const t = treegridFactory("msg-1");
    expect(t.attrs("msg-1")["aria-expanded"]).toBe(false);
  });

  it("A5: expanded parent -- aria-expanded=true", () => {
    const t = treegridFactory("msg-1");
    t.keyboard.press("ArrowRight"); // expand
    expect(t.attrs("msg-1")["aria-expanded"]).toBe(true);
  });

  it("A6: leaf row has NO aria-expanded (not expandable)", () => {
    const t = treegridFactory("msg-3");
    expect(t.attrs("msg-3")["aria-expanded"]).toBeUndefined();
  });
});

// ===============================================
// C1: Click interaction
// ===============================================

describe("APG Treegrid: Click interaction (C1)", () => {
  it("click on unfocused row -- focuses it", () => {
    const t = treegridFactory("msg-1");

    t.click("msg-1a");

    expect(t.focusedItemId()).toBe("msg-1a");
  });

  it("click on expandable row -- focuses and toggles expand", () => {
    const t = treegridFactory("msg-1");
    expect(t.attrs("msg-2")["aria-expanded"]).toBe(false);

    t.click("msg-2");

    expect(t.focusedItemId()).toBe("msg-2");
    expect(t.attrs("msg-2")["aria-expanded"]).toBe(true);
  });
});
