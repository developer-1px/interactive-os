/**
 * APG Listbox Pattern — Contract Test (Playwright 동형)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 *
 * Config: vertical, no-loop, single/multi-select
 * Unique: followFocus on/off, Shift+Arrow range, horizontal variant
 */

import { createPage } from "@os-testing/page";
import { expect as osExpect } from "@os-testing/expect";
import type { Page } from "@os-testing/types";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, it } from "vitest";
import {
  assertBoundaryClamp,
  assertFollowFocus,
  assertHomeEnd,
  assertOrthogonalIgnored,
  assertVerticalNav,
} from "./helpers/contracts";

const expect = osExpect;

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

// ─── Fixtures: create{Role} ───

function createListbox(focusedItem = "apple"): {
  page: Page;
  cleanup: () => void;
} {
  const app = defineApp("test-listbox", {});
  const zone = app.createZone("listbox");
  zone.bind({
    role: "listbox",
    getItems: () => ITEMS,
    options: SINGLE_SELECT,
  });
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

function createMultiListbox(focusedItem = "apple"): {
  page: Page;
  cleanup: () => void;
} {
  const app = defineApp("test-listbox", {});
  const zone = app.createZone("listbox");
  zone.bind({
    role: "listbox",
    getItems: () => ITEMS,
    options: MULTI_SELECT,
  });
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// Shared contracts (page.locator → assertions)
// ═══════════════════════════════════════════════════

describe("APG Listbox: Navigation", () => {
  assertVerticalNav(createListbox);
  assertBoundaryClamp(createListbox, {
    firstId: "apple",
    lastId: "elderberry",
    axis: "vertical",
  });
  assertHomeEnd(createListbox, {
    firstId: "apple",
    lastId: "elderberry",
  });
});

// ═══════════════════════════════════════════════════
// Unique: Single-Select followFocus
// ═══════════════════════════════════════════════════

describe("APG Listbox: Single-Select", () => {
  assertFollowFocus(createListbox);

  it("selection follows focus on Home (aria-selected)", async () => {
    const { page, cleanup } = createListbox("cherry");
    page.keyboard.press("Home");
    await expect(page.locator("#apple")).toBeFocused();
    await expect(page.locator("#apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cherry")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });

  it("selection follows focus on End (aria-selected)", async () => {
    const { page, cleanup } = createListbox("banana");
    page.keyboard.press("End");
    await expect(page.locator("#elderberry")).toBeFocused();
    await expect(page.locator("#elderberry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Single-select: Negative Tests (MUST NOT)
// W3C APG: "No more than one option is selected at a time
//           if aria-multiselectable is not true."
// ═══════════════════════════════════════════════════

describe("APG Listbox: Single-Select Negative (MUST NOT)", () => {
  it("Shift+ArrowDown: MUST NOT create range selection — only followFocus", async () => {
    const { page, cleanup } = createListbox("apple");
    page.keyboard.press("Shift+ArrowDown");
    // Focus moved, selection followed — but only 1 item selected, never 2
    await expect(page.locator("#banana")).toBeFocused();
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#apple")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });

  it("Shift+ArrowUp: MUST NOT create range selection", async () => {
    const { page, cleanup } = createListbox("cherry");
    page.keyboard.press("Shift+ArrowUp");
    await expect(page.locator("#banana")).toBeFocused();
    // Only 1 selected
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cherry")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });

  it("Space: MUST NOT deselect focused item (replace, not toggle)", async () => {
    const { page, cleanup } = createListbox("apple");
    await expect(page.locator("#apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    page.keyboard.press("Space");
    // Still selected — NOT deselected
    await expect(page.locator("#apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });

  it("navigate always keeps exactly 1 item selected (invariant)", async () => {
    const { page, cleanup } = createListbox("apple");
    // After each nav, exactly 1 is selected (the focused one, via followFocus)
    page.keyboard.press("ArrowDown");
    await expect(page.locator(":focus")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    page.keyboard.press("ArrowDown");
    await expect(page.locator(":focus")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    page.keyboard.press("Home");
    await expect(page.locator(":focus")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    page.keyboard.press("End");
    await expect(page.locator(":focus")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });

  it("Ctrl+A: MUST NOT select all in single-select", async () => {
    const { page, cleanup } = createListbox("apple");
    page.keyboard.press("Meta+A");
    // Only 1 selected
    await expect(page.locator("#apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });

  it("Shift+Click: MUST NOT create range selection (single-select enforces replace)", async () => {
    const { page, cleanup } = createListbox("banana");
    page.locator("#elderberry").click({ modifiers: ["Shift"] });
    await expect(page.locator("#elderberry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });

  it("Cmd+Click: MUST NOT toggle selection (single-select enforces replace)", async () => {
    const { page, cleanup } = createListbox("banana");
    page.locator("#cherry").click({ modifiers: ["Meta"] });
    await expect(page.locator("#cherry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });

  it("Cmd+Click on already-selected: MUST NOT deselect (single-select invariant)", async () => {
    const { page, cleanup } = createListbox("apple");
    page.locator("#apple").click({ modifiers: ["Meta"] });
    await expect(page.locator("#apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: WAI-ARIA Roles, States, Properties
// W3C APG §"WAI-ARIA Roles, States, and Properties"
// ═══════════════════════════════════════════════════

describe("APG Listbox: DOM Projection (ARIA contract)", () => {
  it("items have role=option (W3C: each option has role option)", async () => {
    const { page, cleanup } = createListbox();
    for (const id of ITEMS) {
      await expect(page.locator("#" + id)).toHaveAttribute("role", "option");
    }
    cleanup();
  });

  it("focused item: tabindex=0, all others: tabindex=-1 (roving tabindex)", async () => {
    const { page, cleanup } = createListbox("cherry");
    await expect(page.locator("#cherry")).toHaveAttribute("tabindex", "0");
    for (const id of ITEMS.filter((i) => i !== "cherry")) {
      await expect(page.locator("#" + id)).toHaveAttribute("tabindex", "-1");
    }
    cleanup();
  });

  it("selected item: aria-selected=true, non-selected: aria-selected=false", async () => {
    const { page, cleanup } = createListbox("banana");
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    for (const id of ITEMS.filter((i) => i !== "banana")) {
      await expect(page.locator("#" + id)).toHaveAttribute(
        "aria-selected",
        "false",
      );
    }
    cleanup();
  });

  it("data-focused: only on focused item", async () => {
    const { page, cleanup } = createListbox("date");
    await expect(page.locator("#date")).toHaveAttribute("data-focused", "true");
    for (const id of ITEMS.filter((i) => i !== "date")) {
      await expect(page.locator("#" + id)).not.toHaveAttribute("data-focused");
    }
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Multi-select: Negative Tests (MUST NOT)
// ═══════════════════════════════════════════════════

describe("APG Listbox: Multi-Select Negative (MUST NOT)", () => {
  it("ArrowDown: MUST NOT change selection (recommended model)", async () => {
    const { page, cleanup } = createMultiListbox("apple");
    // click already selected apple. ArrowDown moves focus, not selection.
    page.keyboard.press("ArrowDown"); // move focus to banana
    // apple stays selected, banana NOT auto-selected
    await expect(page.locator("#apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });

  it("non-selected options: all have aria-selected=false when deselected", async () => {
    const { page, cleanup } = createMultiListbox("apple");
    // click selected apple, toggle it off
    page.keyboard.press("Space");
    // Now no items are selected
    for (const id of ITEMS) {
      await expect(page.locator("#" + id)).toHaveAttribute(
        "aria-selected",
        "false",
      );
    }
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Unique: Multi-Select (Recommended Model)
// ═══════════════════════════════════════════════════

describe("APG Listbox: Multi-Select", () => {
  it("Down Arrow: moves focus without changing selection", async () => {
    const { page, cleanup } = createMultiListbox("apple");
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#banana")).toBeFocused();
    await expect(page.locator("#banana")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#apple")).toHaveAttribute("tabindex", "-1");
    cleanup();
  });

  it("Space: toggles selection of focused option", async () => {
    const { page, cleanup } = createMultiListbox("banana");
    // click already selected banana. Space toggles it off.
    page.keyboard.press("Space");
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    // Space again → back to selected
    page.keyboard.press("Space");
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });

  it("Shift+Down: extends selection range", async () => {
    const { page, cleanup } = createMultiListbox("banana");
    page.locator("#banana").click();
    page.keyboard.press("Shift+ArrowDown");
    await expect(page.locator("#cherry")).toBeFocused();
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cherry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });

  it("Shift+Up: extends selection range backward", async () => {
    const { page, cleanup } = createMultiListbox("cherry");
    page.locator("#cherry").click();
    page.keyboard.press("Shift+ArrowUp");
    await expect(page.locator("#banana")).toBeFocused();
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cherry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });

  it("Shift+Space: range select from anchor to focused", async () => {
    const { page, cleanup } = createMultiListbox("banana");
    page.locator("#banana").click();
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    page.locator("#date").click({ modifiers: ["Shift"] });
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cherry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#date")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });

  it("Shift+Down × 3: progressively extends range", async () => {
    const { page, cleanup } = createMultiListbox("apple");
    page.locator("#apple").click();
    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Shift+ArrowDown");
    await expect(page.locator("#apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cherry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#date")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#elderberry")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });

  it("Shift+Down then Shift+Up: shrinks range", async () => {
    const { page, cleanup } = createMultiListbox("banana");
    page.locator("#banana").click();
    page.keyboard.press("Shift+ArrowDown");
    page.keyboard.press("Shift+ArrowDown");
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cherry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#date")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    page.keyboard.press("Shift+ArrowUp");
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cherry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#date")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Unique: Focus Initialization
// ═══════════════════════════════════════════════════

// Focus Initialization — requires zone activation without click.
// Currently skipped: infrastructure needs Tab/focus-in simulation.
describe.skip("APG Listbox: Focus Initialization", () => {
  it("single-select, no selection: focus goes to first option", async () => {
    const app = defineApp("test-listbox", {});
    const zone = app.createZone("listbox");
    zone.bind({
      role: "listbox",
      getItems: () => ITEMS,
      options: SINGLE_SELECT,
    });
    const { page, cleanup } = createPage(app);
    page.goto("/");
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#apple")).toBeFocused();
    await expect(page.locator("#apple")).toHaveAttribute("tabindex", "0");
    cleanup();
  });

  it("multi-select, no selection: focus first, no auto-select", async () => {
    const app = defineApp("test-listbox", {});
    const zone = app.createZone("listbox");
    zone.bind({
      role: "listbox",
      getItems: () => ITEMS,
      options: MULTI_SELECT,
    });
    const { page, cleanup } = createPage(app);
    page.goto("/");
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#apple")).toBeFocused();
    await expect(page.locator("#apple")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#apple")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Unique: Horizontal Orientation
// ═══════════════════════════════════════════════════

describe("APG Listbox: Horizontal Orientation", () => {
  function createHorizontalListbox(focusedItem = "apple"): {
    page: Page;
    cleanup: () => void;
  } {
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
    const { page, cleanup } = createPage(app);
    page.goto("/");
    page.click(focusedItem);
    return { page, cleanup };
  }

  it("Right Arrow: moves focus to next option", async () => {
    const { page, cleanup } = createHorizontalListbox("apple");
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#banana")).toBeFocused();
    await expect(page.locator("#banana")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });

  it("Left Arrow: moves focus to previous option", async () => {
    const { page, cleanup } = createHorizontalListbox("cherry");
    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#banana")).toBeFocused();
    await expect(page.locator("#banana")).toHaveAttribute("tabindex", "0");
    cleanup();
  });

  assertOrthogonalIgnored(createHorizontalListbox, "horizontal");
});

// ═══════════════════════════════════════════════════
// Unique: RadioGroup Variant (loop + followFocus + disallowEmpty)
// Source: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
// ═══════════════════════════════════════════════════

describe("APG Listbox: RadioGroup Variant", () => {
  function createRadioGroup(selected = "radio-sm"): {
    page: Page;
    cleanup: () => void;
  } {
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
    const { page, cleanup } = createPage(app);
    page.goto("/");
    page.click(selected);
    return { page, cleanup };
  }

  it("navigate + select: Down moves and selects", async () => {
    const { page, cleanup } = createRadioGroup("radio-sm");
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-md")).toBeFocused();
    await expect(page.locator("#radio-md")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#radio-sm")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });

  it("loop: Down at last wraps to first", async () => {
    const { page, cleanup } = createRadioGroup("radio-lg");
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-sm")).toBeFocused();
    await expect(page.locator("#radio-sm")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });

  it("never-empty: always one selection", async () => {
    const { page, cleanup } = createRadioGroup("radio-sm");
    page.keyboard.press("ArrowDown");
    await expect(page.locator(":focus")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    page.keyboard.press("ArrowDown");
    await expect(page.locator(":focus")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    cleanup();
  });
});
