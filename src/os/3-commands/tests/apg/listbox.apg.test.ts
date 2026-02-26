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

import { createOsPage } from "@os/createOsPage";
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
    arrowExpand: false,
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
  const page = createOsPage();
  page.goto("listbox", {
    items: ITEMS,
    config: SINGLE_SELECT,
    role: "listbox",
    focusedItemId: focusedItem,
  });
  page.dispatch(page.OS_SELECT({ targetId: focusedItem, mode: "replace" }));
  return page;
}

function multiSelect(focusedItem = "apple") {
  const page = createOsPage();
  page.goto("listbox", {
    items: ITEMS,
    config: MULTI_SELECT,
    role: "listbox",
    focusedItemId: focusedItem,
  });
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts (pressKey → attrs)
// ═══════════════════════════════════════════════════

describe("APG Listbox: Navigation", () => {
  assertVerticalNav(singleSelect);
  assertBoundaryClamp(singleSelect, {
    firstId: "apple",
    lastId: "elderberry",
    axis: "vertical",
  });
  assertHomeEnd(singleSelect, {
    firstId: "apple",
    lastId: "elderberry",
  });
});

// ═══════════════════════════════════════════════════
// Unique: Single-Select followFocus
// ═══════════════════════════════════════════════════

describe("APG Listbox: Single-Select", () => {
  assertFollowFocus(singleSelect);

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
    t.dispatch(t.OS_SELECT({ targetId: "banana", mode: "replace" }));
    t.keyboard.press("Shift+ArrowDown");
    expect(t.focusedItemId()).toBe("cherry");
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    expect(t.attrs("cherry")["aria-selected"]).toBe(true);
  });

  it("Shift+Up: extends selection range backward", () => {
    const t = multiSelect("cherry");
    t.dispatch(t.OS_SELECT({ targetId: "cherry", mode: "replace" }));
    t.keyboard.press("Shift+ArrowUp");
    expect(t.focusedItemId()).toBe("banana");
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    expect(t.attrs("cherry")["aria-selected"]).toBe(true);
  });

  it("Shift+Space: range select from anchor to focused", () => {
    const t = multiSelect("banana");
    t.dispatch(t.OS_SELECT({ targetId: "banana", mode: "replace" }));
    t.keyboard.press("ArrowDown");
    t.keyboard.press("ArrowDown");
    t.dispatch(t.OS_SELECT({ targetId: "date", mode: "range" }));
    expect(t.attrs("banana")["aria-selected"]).toBe(true);
    expect(t.attrs("cherry")["aria-selected"]).toBe(true);
    expect(t.attrs("date")["aria-selected"]).toBe(true);
  });

  it("Shift+Down × 3: progressively extends range", () => {
    const t = multiSelect("apple");
    t.dispatch(t.OS_SELECT({ targetId: "apple", mode: "replace" }));
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
    t.dispatch(t.OS_SELECT({ targetId: "banana", mode: "replace" }));
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
    const page = createOsPage();
    page.goto("listbox", {
      items: ITEMS,
      config: SINGLE_SELECT,
      role: "listbox",
      focusedItemId: null,
    });
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId()).toBe("apple");
    expect(page.attrs("apple").tabIndex).toBe(0);
  });

  it("multi-select, no selection: focus first, no auto-select", () => {
    const page = createOsPage();
    page.goto("listbox", {
      items: ITEMS,
      config: MULTI_SELECT,
      role: "listbox",
      focusedItemId: null,
    });
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
    const page = createOsPage();
    page.goto("listbox", {
      items: ITEMS,
      config: {
        navigate: { ...SINGLE_SELECT.navigate, orientation: "horizontal" },
        select: SINGLE_SELECT.select,
      },
      role: "listbox",
      focusedItemId: focusedItem,
    });
    page.dispatch(page.OS_SELECT({ targetId: focusedItem, mode: "replace" }));
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

  assertOrthogonalIgnored(horizontal, "horizontal");
});

// ═══════════════════════════════════════════════════
// Unique: RadioGroup Variant (loop + followFocus + disallowEmpty)
// Source: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
// ═══════════════════════════════════════════════════

describe("APG Listbox: RadioGroup Variant", () => {
  function radioGroup(selected = "radio-sm") {
    const page = createOsPage();
    page.goto("radiogroup", {
      items: ["radio-sm", "radio-md", "radio-lg"],
      config: {
        navigate: {
          ...SINGLE_SELECT.navigate,
          loop: true,
          entry: "selected" as const,
        },
        select: { ...SINGLE_SELECT.select, disallowEmpty: true },
      },
      role: "listbox",
      focusedItemId: selected,
    });
    page.dispatch(page.OS_SELECT({ targetId: selected, mode: "replace" }));
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
