/**
 * APG Listbox Pattern — Contract Test
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 *
 * Config: vertical, no-loop, single/multi-select
 * Unique: followFocus on/off, Shift+Arrow range, horizontal variant
 */

import { describe, expect, it } from "vitest";
import { createTestOsKernel } from "../integration/helpers/createTestOsKernel";
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
    const t = createTestOsKernel();
    t.setItems(ITEMS);
    t.setConfig(SINGLE_SELECT);
    t.setActiveZone("listbox", focusedItem);
    t.dispatch(t.OS_SELECT({ targetId: focusedItem, mode: "replace" }));
    return t;
}

function multiSelect(focusedItem = "apple") {
    const t = createTestOsKernel();
    t.setItems(ITEMS);
    t.setConfig(MULTI_SELECT);
    t.setActiveZone("listbox", focusedItem);
    return t;
}

// ═══════════════════════════════════════════════════
// Shared contracts
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

    it("selection follows focus on Home", () => {
        const t = singleSelect("cherry");
        t.dispatch(t.OS_NAVIGATE({ direction: "home" }));
        expect(t.focusedItemId()).toBe("apple");
        expect(t.selection()).toEqual(["apple"]);
    });

    it("selection follows focus on End", () => {
        const t = singleSelect("banana");
        t.dispatch(t.OS_NAVIGATE({ direction: "end" }));
        expect(t.focusedItemId()).toBe("elderberry");
        expect(t.selection()).toEqual(["elderberry"]);
    });
});

// ═══════════════════════════════════════════════════
// Unique: Multi-Select (Recommended Model)
// ═══════════════════════════════════════════════════

describe("APG Listbox: Multi-Select", () => {
    it("Down Arrow: moves focus without changing selection", () => {
        const t = multiSelect("apple");
        t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("banana");
        expect(t.selection()).toEqual([]);
    });

    it("Space: toggles selection of focused option", () => {
        const t = multiSelect("banana");
        t.dispatch(t.OS_SELECT({ targetId: "banana", mode: "toggle" }));
        expect(t.selection()).toEqual(["banana"]);
    });

    it("Space: deselects already-selected option", () => {
        const t = multiSelect("banana");
        t.dispatch(t.OS_SELECT({ targetId: "banana", mode: "toggle" }));
        t.dispatch(t.OS_SELECT({ targetId: "banana", mode: "toggle" }));
        expect(t.selection()).toEqual([]);
    });

    it("Shift+Down: extends selection range", () => {
        const t = multiSelect("banana");
        t.dispatch(t.OS_SELECT({ targetId: "banana", mode: "replace" }));
        t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
        expect(t.focusedItemId()).toBe("cherry");
        expect(t.selection()).toEqual(["banana", "cherry"]);
    });

    it("Shift+Up: extends selection range backward", () => {
        const t = multiSelect("cherry");
        t.dispatch(t.OS_SELECT({ targetId: "cherry", mode: "replace" }));
        t.dispatch(t.OS_NAVIGATE({ direction: "up", select: "range" }));
        expect(t.focusedItemId()).toBe("banana");
        expect(t.selection()).toEqual(["banana", "cherry"]);
    });

    it("Shift+Space: range select from anchor to focused", () => {
        const t = multiSelect("banana");
        t.dispatch(t.OS_SELECT({ targetId: "banana", mode: "replace" }));
        t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
        t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
        t.dispatch(t.OS_SELECT({ targetId: "date", mode: "range" }));
        expect(t.selection()).toEqual(["banana", "cherry", "date"]);
    });

    it("Shift+Down × 3: progressively extends range", () => {
        const t = multiSelect("apple");
        t.dispatch(t.OS_SELECT({ targetId: "apple", mode: "replace" }));
        t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
        t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
        t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
        expect(t.selection()).toEqual(["apple", "banana", "cherry", "date"]);
    });

    it("Shift+Down then Shift+Up: shrinks range", () => {
        const t = multiSelect("banana");
        t.dispatch(t.OS_SELECT({ targetId: "banana", mode: "replace" }));
        t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
        t.dispatch(t.OS_NAVIGATE({ direction: "down", select: "range" }));
        expect(t.selection()).toEqual(["banana", "cherry", "date"]);
        t.dispatch(t.OS_NAVIGATE({ direction: "up", select: "range" }));
        expect(t.selection()).toEqual(["banana", "cherry"]);
    });
});

// ═══════════════════════════════════════════════════
// Unique: Focus Initialization
// ═══════════════════════════════════════════════════

describe("APG Listbox: Focus Initialization", () => {
    it("single-select, no selection: focus goes to first option", () => {
        const t = createTestOsKernel();
        t.setItems(ITEMS);
        t.setConfig(SINGLE_SELECT);
        t.setActiveZone("listbox", null);
        t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("apple");
    });

    it("multi-select, no selection: focus first, no auto-select", () => {
        const t = createTestOsKernel();
        t.setItems(ITEMS);
        t.setConfig(MULTI_SELECT);
        t.setActiveZone("listbox", null);
        t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("apple");
        expect(t.selection()).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════
// Unique: Horizontal Orientation
// ═══════════════════════════════════════════════════

describe("APG Listbox: Horizontal Orientation", () => {
    function horizontal(focusedItem = "apple") {
        const t = createTestOsKernel();
        t.setItems(ITEMS);
        t.setConfig({
            navigate: { ...SINGLE_SELECT.navigate, orientation: "horizontal" },
            select: SINGLE_SELECT.select,
        });
        t.setActiveZone("listbox", focusedItem);
        t.dispatch(t.OS_SELECT({ targetId: focusedItem, mode: "replace" }));
        return t;
    }

    it("Right Arrow: moves focus to next option", () => {
        const t = horizontal("apple");
        t.dispatch(t.OS_NAVIGATE({ direction: "right" }));
        expect(t.focusedItemId()).toBe("banana");
    });

    it("Left Arrow: moves focus to previous option", () => {
        const t = horizontal("cherry");
        t.dispatch(t.OS_NAVIGATE({ direction: "left" }));
        expect(t.focusedItemId()).toBe("banana");
    });

    assertOrthogonalIgnored(horizontal, "horizontal");
});

// ═══════════════════════════════════════════════════
// Unique: RadioGroup Variant (loop + followFocus + disallowEmpty)
// Source: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
// ═══════════════════════════════════════════════════

describe("APG Listbox: RadioGroup Variant", () => {
    function radioGroup(selected = "radio-sm") {
        const t = createTestOsKernel();
        t.setItems(["radio-sm", "radio-md", "radio-lg"]);
        t.setConfig({
            navigate: {
                ...SINGLE_SELECT.navigate,
                loop: true,
                entry: "selected" as const,
            },
            select: {
                ...SINGLE_SELECT.select,
                disallowEmpty: true,
            },
        });
        t.setActiveZone("radiogroup", selected);
        t.dispatch(t.OS_SELECT({ targetId: selected, mode: "replace" }));
        return t;
    }

    it("navigate + select: Down moves and selects", () => {
        const t = radioGroup("radio-sm");
        t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("radio-md");
        expect(t.selection()).toEqual(["radio-md"]);
    });

    it("loop: Down at last wraps to first", () => {
        const t = radioGroup("radio-lg");
        t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("radio-sm");
        expect(t.selection()).toEqual(["radio-sm"]);
    });

    it("never-empty: always one selection", () => {
        const t = radioGroup("radio-sm");
        t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
        expect(t.selection()).toHaveLength(1);
        t.dispatch(t.OS_NAVIGATE({ direction: "down" }));
        expect(t.selection()).toHaveLength(1);
    });
});
