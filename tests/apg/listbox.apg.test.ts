/**
 * APG Listbox Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey / click (user action simulation)
 *   Assert: attrs() → tabIndex, aria-selected, data-focused (ARIA contract)
 *
 * Config: vertical, no-loop, single/multi-select
 * Unique: followFocus on/off, Shift+Arrow range, horizontal variant
 */

import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";
import {
  assertBoundaryClamp,
  assertFollowFocus,
  assertHomeEnd,
  assertOrthogonalIgnored,
  assertVerticalNav,
} from "./helpers/contracts";

// ─── Configs ───

const ITEMS = ["apple", "banana", "cherry", "date", "elderberry"];

const SINGLE_SELECT = {
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
    followFocus: true,
    disallowEmpty: false,
    range: false,
    toggle: false,
  },
};

const MULTI_SELECT = {
  navigate: { ...SINGLE_SELECT.navigate },
  select: {
    mode: "multiple" as const,
    followFocus: false,
    disallowEmpty: false,
    range: true,
    toggle: false,
  },
};

function singleSelect(focusedItem = "apple") {
  const app = defineApp("test-listbox", {});
  const zone = app.createZone("listbox");
  zone.bind({
    role: "listbox",
    getItems: () => ITEMS,
    options: SINGLE_SELECT,
  });
  const page = createPage(app);
  page.goto("listbox", { focusedItemId: focusedItem });
  page.click(focusedItem);
  return page;
}

function multiSelect(focusedItem = "apple") {
  const app = defineApp("test-listbox", {});
  const zone = app.createZone("listbox");
  zone.bind({
    role: "listbox",
    getItems: () => ITEMS,
    options: MULTI_SELECT,
  });
  const page = createPage(app);
  page.goto("listbox", { focusedItemId: focusedItem });
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts (pressKey → attrs)
// ═══════════════════════════════════════════════════

describe("APG Listbox: Navigation", () => {
  assertVerticalNav(singleSelect as any);
  assertBoundaryClamp(singleSelect as any, {
    firstId: "apple",
    lastId: "elderberry",
    axis: "vertical",
  });
  assertHomeEnd(singleSelect as any, {
    firstId: "apple",
    lastId: "elderberry",
  });
});

// ═══════════════════════════════════════════════════
// Unique: Single-Select followFocus
// ═══════════════════════════════════════════════════

describe("APG Listbox: Single-Select", () => {
  assertFollowFocus(singleSelect as any);

  it("selection follows focus on Home (aria-selected)", () => {
    const t = singleSelect("cherry");
    t.keyboard.press("Home");
    expect(t.focusedItemId()).toBe("apple");
    expect(t.attrs("apple")["aria-selected"]).toBe(true);
    expect(t.attrs("cherry")["aria-selected"]).toBe(false);
  });

  it("selection follows focus on End (aria-selected)", () => {
    const t = singleSelect("banana");
    t.keyboard.press("End");
    expect(t.focusedItemId()).toBe("elderberry");
    expect(t.attrs("elderberry")["aria-selected"]).toBe(true);
    expect(t.attrs("banana")["aria-selected"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════
// Single-select: Negative Tests (MUST NOT)
// W3C APG: "No more than one option is selected at a time
//           if aria-multiselectable is not true."
// ═══════════════════════════════════════════════════

describe("APG Listbox: Single-Select Negative (MUST NOT)", () => {
  it("Shift+ArrowDown: MUST NOT create range selection — only followFocus", () => {
    // W3C: Shift+Arrow is multi-select only. In single-select, arrow just moves focus.
    const t = singleSelect("apple");
    t.keyboard.press("Shift+ArrowDown");
    // Focus moved, selection followed — but only 1 item selected, never 2
    expect(t.selection()).toHaveLength(1);
    expect(t.selection()).not.toContain("apple"); // old item deselected
    expect(t.focusedItemId()).toBe("banana");
  });

  it("Shift+ArrowUp: MUST NOT create range selection", () => {
    const t = singleSelect("cherry");
    t.keyboard.press("Shift+ArrowUp");
    expect(t.selection()).toHaveLength(1);
    expect(t.focusedItemId()).toBe("banana");
  });

  it("Space: MUST NOT deselect focused item (replace, not toggle)", () => {
    // W3C single-select: Space selects the focused option.
    // With toggle:false, pressing Space on already-selected item → replace (same item stays).
    const t = singleSelect("apple");
    expect(t.selection()).toContain("apple");
    t.keyboard.press("Space");
    // Still selected — NOT deselected
    expect(t.selection()).toContain("apple");
    expect(t.selection()).toHaveLength(1);
  });

  it("navigate always keeps exactly 1 item selected (invariant)", () => {
    // W3C: followFocus means exactly 1 is always selected
    const t = singleSelect("apple");
    t.keyboard.press("ArrowDown");
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("ArrowDown");
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("Home");
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("End");
    expect(t.selection()).toHaveLength(1);
  });

  it("Ctrl+A: MUST NOT select all in single-select", () => {
    const t = singleSelect("apple");
    t.keyboard.press("Meta+A");
    // Single-select: select-all is meaningless
    expect(t.selection()).toHaveLength(1);
  });

  it("Shift+Click: MUST NOT create range selection (single-select enforces replace)", () => {
    const t = singleSelect("banana");
    t.click("elderberry", { shift: true });
    expect(t.selection()).toHaveLength(1);
    expect(t.selection()).toContain("elderberry"); // replaced, not range
    expect(t.selection()).not.toContain("banana"); // old deselected
  });

  it("Cmd+Click: MUST NOT toggle selection (single-select enforces replace)", () => {
    const t = singleSelect("banana");
    t.click("cherry", { meta: true });
    expect(t.selection()).toHaveLength(1);
    expect(t.selection()).toContain("cherry");
    expect(t.selection()).not.toContain("banana");
  });

  it("Cmd+Click on already-selected: MUST NOT deselect (single-select invariant)", () => {
    const t = singleSelect("apple");
    t.click("apple", { meta: true });
    // Still selected — replace(self) keeps it
    expect(t.selection()).toContain("apple");
    expect(t.selection()).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: WAI-ARIA Roles, States, Properties
// W3C APG §"WAI-ARIA Roles, States, and Properties"
// ═══════════════════════════════════════════════════

describe("APG Listbox: DOM Projection (ARIA contract)", () => {
  it("items have role=option (W3C: each option has role option)", () => {
    const t = singleSelect();
    for (const id of ITEMS) {
      expect(t.attrs(id).role).toBe("option");
    }
  });

  it("focused item: tabIndex=0, all others: tabIndex=-1 (roving tabindex)", () => {
    const t = singleSelect("cherry");
    expect(t.attrs("cherry").tabIndex).toBe(0);
    for (const id of ITEMS.filter((i) => i !== "cherry")) {
      expect(t.attrs(id).tabIndex).toBe(-1);
    }
  });

  it("selected item: aria-selected=true, non-selected: aria-selected=false", () => {
    // W3C: "All options that are selectable but not selected have
    //        aria-selected set to false."
    const t = singleSelect("banana");
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    for (const id of ITEMS.filter((i) => i !== "banana")) {
      expect(t.attrs(id)["aria-selected"]).toBe(false);
    }
  });

  it("data-focused: only on focused item", () => {
    const t = singleSelect("date");
    expect(t.attrs("date")["data-focused"]).toBe(true);
    for (const id of ITEMS.filter((i) => i !== "date")) {
      expect(t.attrs(id)["data-focused"]).toBeUndefined();
    }
  });
});

// ═══════════════════════════════════════════════════
// Multi-select: Negative Tests (MUST NOT)
// ═══════════════════════════════════════════════════

describe("APG Listbox: Multi-Select Negative (MUST NOT)", () => {
  it("ArrowDown: MUST NOT change selection (recommended model)", () => {
    // W3C recommended: "Down Arrow moves focus without changing selection state"
    const t = multiSelect("apple");
    t.keyboard.press("Space"); // select apple
    t.keyboard.press("ArrowDown"); // move focus to banana
    // apple stays selected, banana NOT auto-selected
    expect(t.selection()).toEqual(["apple"]);
    expect(t.attrs("banana")["aria-selected"]).toBe(false);
  });

  it("non-selected options: aria-selected=false (not absent)", () => {
    // W3C: "All options that are selectable but not selected have
    //        aria-selected set to false."
    const t = multiSelect();
    for (const id of ITEMS) {
      expect(t.attrs(id)["aria-selected"]).toBe(false);
    }
  });
});

// ═══════════════════════════════════════════════════
// Unique: Multi-Select (Recommended Model)
// ═══════════════════════════════════════════════════

describe("APG Listbox: Multi-Select", () => {
  it("Down Arrow: moves focus without changing selection", () => {
    const t = multiSelect("apple");
    t.keyboard.press("ArrowDown");
    expect(t.focusedItemId()).toBe("banana");
    expect(t.attrs("banana").tabIndex).toBe(0);
    expect(t.attrs("banana")["aria-selected"]).toBe(false);
    expect(t.attrs("apple").tabIndex).toBe(-1);
  });

  it("Space: toggles selection of focused option", () => {
    const t = multiSelect("banana");
    t.keyboard.press("Space");
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
  });

  it("Space: deselects already-selected option", () => {
    const t = multiSelect("banana");
    t.keyboard.press("Space");
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    t.keyboard.press("Space");
    expect(t.attrs("banana")["aria-selected"]).toBe(false);
  });

  it("Shift+Down: extends selection range", () => {
    const t = multiSelect("banana");
    t.click("banana");
    t.keyboard.press("Shift+ArrowDown");
    expect(t.focusedItemId()).toBe("cherry");
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    expect(t.attrs("cherry")["aria-selected"]).toBe(true);
  });

  it("Shift+Up: extends selection range backward", () => {
    const t = multiSelect("cherry");
    t.click("cherry");
    t.keyboard.press("Shift+ArrowUp");
    expect(t.focusedItemId()).toBe("banana");
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    expect(t.attrs("cherry")["aria-selected"]).toBe(true);
  });

  it("Shift+Space: range select from anchor to focused", () => {
    const t = multiSelect("banana");
    t.click("banana");
    t.keyboard.press("ArrowDown");
    t.keyboard.press("ArrowDown");
    t.click("date", { shift: true });
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    expect(t.attrs("cherry")["aria-selected"]).toBe(true);
    expect(t.attrs("date")["aria-selected"]).toBe(true);
  });

  it("Shift+Down × 3: progressively extends range", () => {
    const t = multiSelect("apple");
    t.click("apple");
    t.keyboard.press("Shift+ArrowDown");
    t.keyboard.press("Shift+ArrowDown");
    t.keyboard.press("Shift+ArrowDown");
    expect(t.attrs("apple")["aria-selected"]).toBe(true);
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    expect(t.attrs("cherry")["aria-selected"]).toBe(true);
    expect(t.attrs("date")["aria-selected"]).toBe(true);
    expect(t.attrs("elderberry")["aria-selected"]).toBe(false);
  });

  it("Shift+Down then Shift+Up: shrinks range", () => {
    const t = multiSelect("banana");
    t.click("banana");
    t.keyboard.press("Shift+ArrowDown");
    t.keyboard.press("Shift+ArrowDown");
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    expect(t.attrs("cherry")["aria-selected"]).toBe(true);
    expect(t.attrs("date")["aria-selected"]).toBe(true);
    t.keyboard.press("Shift+ArrowUp");
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    expect(t.attrs("cherry")["aria-selected"]).toBe(true);
    expect(t.attrs("date")["aria-selected"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════
// Unique: Focus Initialization
// ═══════════════════════════════════════════════════

describe("APG Listbox: Focus Initialization", () => {
  it("single-select, no selection: focus goes to first option", () => {
    const app = defineApp("test-listbox", {});
    const zone = app.createZone("listbox");
    zone.bind({
      role: "listbox",
      getItems: () => ITEMS,
      options: SINGLE_SELECT,
    });
    const page = createPage(app);
    page.goto("listbox", { focusedItemId: null });
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("apple");
    expect(page.attrs("apple").tabIndex).toBe(0);
  });

  it("multi-select, no selection: focus first, no auto-select", () => {
    const app = defineApp("test-listbox", {});
    const zone = app.createZone("listbox");
    zone.bind({
      role: "listbox",
      getItems: () => ITEMS,
      options: MULTI_SELECT,
    });
    const page = createPage(app);
    page.goto("listbox", { focusedItemId: null });
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("apple");
    expect(page.attrs("apple").tabIndex).toBe(0);
    expect(page.attrs("apple")["aria-selected"]).toBe(false);
  });
});

// ═══════════════════════════════════════════════════
// Unique: Horizontal Orientation
// ═══════════════════════════════════════════════════

describe("APG Listbox: Horizontal Orientation", () => {
  function horizontal(focusedItem = "apple") {
    const app = defineApp("test-listbox", {});
    const zone = app.createZone("listbox");
    zone.bind({
      role: "listbox",
      getItems: () => ITEMS,
      options: {
        navigate: { ...SINGLE_SELECT.navigate, orientation: "horizontal" },
        select: SINGLE_SELECT.select,
      },
    });
    const page = createPage(app);
    page.goto("listbox", { focusedItemId: focusedItem });
    page.click(focusedItem);
    return page;
  }

  it("Right Arrow: moves focus to next option", () => {
    const t = horizontal("apple");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("banana");
    expect(t.attrs("banana").tabIndex).toBe(0);
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
  });

  it("Left Arrow: moves focus to previous option", () => {
    const t = horizontal("cherry");
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("banana");
    expect(t.attrs("banana").tabIndex).toBe(0);
  });

  assertOrthogonalIgnored(horizontal as any, "horizontal");
});

// ═══════════════════════════════════════════════════
// Unique: RadioGroup Variant (loop + followFocus + disallowEmpty)
// Source: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
// ═══════════════════════════════════════════════════

describe("APG Listbox: RadioGroup Variant", () => {
  function radioGroup(selected = "radio-sm") {
    const app = defineApp("test-listbox", {});
    const zone = app.createZone("radiogroup");
    zone.bind({
      role: "listbox",
      getItems: () => ["radio-sm", "radio-md", "radio-lg"],
      options: {
        navigate: {
          ...SINGLE_SELECT.navigate,
          loop: true,
          entry: "selected" as const,
        },
        select: { ...SINGLE_SELECT.select, disallowEmpty: true },
      },
    });
    const page = createPage(app);
    page.goto("radiogroup", { focusedItemId: selected });
    page.click(selected);
    return page;
  }

  it("navigate + select: Down moves and selects", () => {
    const t = radioGroup("radio-sm");
    t.keyboard.press("ArrowDown");
    expect(t.focusedItemId()).toBe("radio-md");
    expect(t.attrs("radio-md")["aria-selected"]).toBe(true);
    expect(t.attrs("radio-sm")["aria-selected"]).toBe(false);
  });

  it("loop: Down at last wraps to first", () => {
    const t = radioGroup("radio-lg");
    t.keyboard.press("ArrowDown");
    expect(t.focusedItemId()).toBe("radio-sm");
    expect(t.attrs("radio-sm")["aria-selected"]).toBe(true);
  });

  it("never-empty: always one selection", () => {
    const t = radioGroup("radio-sm");
    t.keyboard.press("ArrowDown");
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("ArrowDown");
    expect(t.selection()).toHaveLength(1);
  });
});
