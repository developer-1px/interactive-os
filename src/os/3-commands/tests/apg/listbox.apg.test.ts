/**
 * APG Listbox Pattern — Contract Test (Headless Kernel)
 *
 * Source of Truth: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 *
 * Verifies that the Interaction OS satisfies the W3C APG Listbox
 * keyboard interaction contract using headless kernel dispatch.
 *
 * Structure:
 *   1. Single-Select Listbox
 *   2. Multi-Select Listbox (Recommended Model)
 *   3. Focus Initialization
 *   4. Horizontal Listbox (axis swap)
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "../integration/helpers/createTestKernel";

// ─── Helpers ───

/** Standard vertical single-select listbox config */
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

/** Standard vertical multi-select listbox config (Recommended model) */
const MULTI_SELECT = {
    navigate: {
        orientation: "vertical" as const,
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first" as const,
        recovery: "next" as const,
    },
    select: {
        mode: "multiple" as const,
        followFocus: false,
        disallowEmpty: false,
        range: true,
        toggle: false,
    },
};

const ITEMS = ["apple", "banana", "cherry", "date", "elderberry"];

function singleSelectListbox(focusedItem = "apple") {
    const t = createTestKernel();
    t.setItems(ITEMS);
    t.setConfig(SINGLE_SELECT);
    t.setActiveZone("listbox", focusedItem);
    t.dispatch(t.SELECT({ targetId: focusedItem, mode: "replace" }));
    return t;
}

function multiSelectListbox(focusedItem = "apple") {
    const t = createTestKernel();
    t.setItems(ITEMS);
    t.setConfig(MULTI_SELECT);
    t.setActiveZone("listbox", focusedItem);
    return t;
}

// ═══════════════════════════════════════════════════════════════════
// 1. APG Listbox: Single-Select Keyboard Interaction
// ═══════════════════════════════════════════════════════════════════

describe("APG Listbox: Single-Select", () => {
    // APG: "Down Arrow: Moves focus to the next option."
    it("Down Arrow: moves focus to next option", () => {
        const t = singleSelectListbox("apple");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("banana");
    });

    // APG: "Up Arrow: Moves focus to the previous option."
    it("Up Arrow: moves focus to previous option", () => {
        const t = singleSelectListbox("cherry");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("banana");
    });

    // APG: "Home: Moves focus to first option."
    it("Home: moves focus to first option", () => {
        const t = singleSelectListbox("cherry");

        t.dispatch(t.NAVIGATE({ direction: "home" }));

        expect(t.focusedItemId()).toBe("apple");
    });

    // APG: "End: Moves focus to last option."
    it("End: moves focus to last option", () => {
        const t = singleSelectListbox("banana");

        t.dispatch(t.NAVIGATE({ direction: "end" }));

        expect(t.focusedItemId()).toBe("elderberry");
    });

    // APG: "Optionally, in a single-select listbox, selection may also move with focus."
    // Our implementation uses followFocus=true for this.
    it("selection follows focus (followFocus=true)", () => {
        const t = singleSelectListbox("apple");
        expect(t.selection()).toEqual(["apple"]);

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("banana");
        expect(t.selection()).toEqual(["banana"]);
    });

    it("selection follows focus on Home", () => {
        const t = singleSelectListbox("cherry");

        t.dispatch(t.NAVIGATE({ direction: "home" }));

        expect(t.focusedItemId()).toBe("apple");
        expect(t.selection()).toEqual(["apple"]);
    });

    it("selection follows focus on End", () => {
        const t = singleSelectListbox("banana");

        t.dispatch(t.NAVIGATE({ direction: "end" }));

        expect(t.focusedItemId()).toBe("elderberry");
        expect(t.selection()).toEqual(["elderberry"]);
    });

    // APG: At boundary, Down Arrow at last item should NOT wrap (no loop for standard listbox)
    it("Down Arrow at last option: focus stays (no wrap)", () => {
        const t = singleSelectListbox("elderberry");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("elderberry");
    });

    // APG: At boundary, Up Arrow at first item should NOT wrap
    it("Up Arrow at first option: focus stays (no wrap)", () => {
        const t = singleSelectListbox("apple");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("apple");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. APG Listbox: Multi-Select Keyboard Interaction
//    (Recommended Model — no modifier keys required for navigation)
// ═══════════════════════════════════════════════════════════════════

describe("APG Listbox: Multi-Select (Recommended Model)", () => {
    // APG: "Down Arrow: Moves focus to the next option." (without changing selection)
    it("Down Arrow: moves focus without changing selection", () => {
        const t = multiSelectListbox("apple");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("banana");
        expect(t.selection()).toEqual([]); // no auto-select
    });

    // APG: "Up Arrow: Moves focus to the previous option." (without changing selection)
    it("Up Arrow: moves focus without changing selection", () => {
        const t = multiSelectListbox("cherry");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("banana");
        expect(t.selection()).toEqual([]);
    });

    // APG: "Space: changes the selection state of the focused option."
    it("Space: toggles selection of focused option", () => {
        const t = multiSelectListbox("banana");

        // Space = SELECT toggle
        t.dispatch(t.SELECT({ targetId: "banana", mode: "toggle" }));

        expect(t.selection()).toEqual(["banana"]);
    });

    it("Space: deselects already-selected option", () => {
        const t = multiSelectListbox("banana");
        t.dispatch(t.SELECT({ targetId: "banana", mode: "toggle" }));
        expect(t.selection()).toEqual(["banana"]);

        // Space again = deselect
        t.dispatch(t.SELECT({ targetId: "banana", mode: "toggle" }));

        expect(t.selection()).toEqual([]);
    });

    // APG: "Shift + Down Arrow: Moves focus to and toggles the selected state of the next option."
    it("Shift+Down: moves focus and extends selection range", () => {
        const t = multiSelectListbox("banana");
        // Set selection anchor
        t.dispatch(t.SELECT({ targetId: "banana", mode: "replace" }));

        // Shift+Down
        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));

        expect(t.focusedItemId()).toBe("cherry");
        expect(t.selection()).toEqual(["banana", "cherry"]);
    });

    // APG: "Shift + Up Arrow: Moves focus to and toggles the selected state of the previous option."
    it("Shift+Up: moves focus and extends selection range backward", () => {
        const t = multiSelectListbox("cherry");
        t.dispatch(t.SELECT({ targetId: "cherry", mode: "replace" }));

        // Shift+Up
        t.dispatch(t.NAVIGATE({ direction: "up", select: "range" }));

        expect(t.focusedItemId()).toBe("banana");
        expect(t.selection()).toEqual(["banana", "cherry"]);
    });

    // APG: "Shift + Space: Selects contiguous items from the most recently selected item to the focused item."
    it("Shift+Space: range select from anchor to focused", () => {
        const t = multiSelectListbox("banana");
        t.dispatch(t.SELECT({ targetId: "banana", mode: "replace" }));

        // Navigate down twice (no selection change)
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).toBe("date");
        expect(t.selection()).toEqual(["banana"]); // only anchor

        // Shift+Space = range selection from anchor (banana) to focused (date)
        t.dispatch(t.SELECT({ targetId: "date", mode: "range" }));

        expect(t.selection()).toEqual(["banana", "cherry", "date"]);
    });

    // APG: Multi Shift+Down successive extends
    it("Shift+Down × 3: progressively extends range", () => {
        const t = multiSelectListbox("apple");
        t.dispatch(t.SELECT({ targetId: "apple", mode: "replace" }));

        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));
        expect(t.selection()).toEqual(["apple", "banana"]);

        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));
        expect(t.selection()).toEqual(["apple", "banana", "cherry"]);

        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));
        expect(t.selection()).toEqual(["apple", "banana", "cherry", "date"]);
    });

    // APG: Shift+Down then Shift+Up shrinks the range
    it("Shift+Down then Shift+Up: shrinks range", () => {
        const t = multiSelectListbox("banana");
        t.dispatch(t.SELECT({ targetId: "banana", mode: "replace" }));

        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));
        t.dispatch(t.NAVIGATE({ direction: "down", select: "range" }));
        expect(t.selection()).toEqual(["banana", "cherry", "date"]);

        // Shrink
        t.dispatch(t.NAVIGATE({ direction: "up", select: "range" }));
        expect(t.selection()).toEqual(["banana", "cherry"]);
    });

    // APG: Home/End in multi-select
    it("Home: moves focus to first option (no selection change)", () => {
        const t = multiSelectListbox("cherry");

        t.dispatch(t.NAVIGATE({ direction: "home" }));

        expect(t.focusedItemId()).toBe("apple");
        expect(t.selection()).toEqual([]); // unchanged
    });

    it("End: moves focus to last option (no selection change)", () => {
        const t = multiSelectListbox("banana");

        t.dispatch(t.NAVIGATE({ direction: "end" }));

        expect(t.focusedItemId()).toBe("elderberry");
        expect(t.selection()).toEqual([]); // unchanged
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. APG Listbox: Focus Initialization
// ═══════════════════════════════════════════════════════════════════

describe("APG Listbox: Focus Initialization", () => {
    // APG: "When a single-select listbox receives focus:
    //   If none of the options are selected, the first option receives focus."
    it("single-select, no selection: focus goes to first option", () => {
        const t = createTestKernel();
        t.setItems(ITEMS);
        t.setConfig(SINGLE_SELECT);
        t.setActiveZone("listbox", null);

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("apple");
    });

    // APG: "When a multi-select listbox receives focus:
    //   If none of the options are selected, focus is set on the first option
    //   and there is no automatic change in the selection state."
    it("multi-select, no selection: focus first, no auto-select", () => {
        const t = createTestKernel();
        t.setItems(ITEMS);
        t.setConfig(MULTI_SELECT);
        t.setActiveZone("listbox", null);

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("apple");
        expect(t.selection()).toEqual([]); // no auto-select
    });
});

// ═══════════════════════════════════════════════════════════════════
// 4. APG Listbox: Horizontal Orientation
//    "If the options are arranged horizontally:
//     Down Arrow performs as Right Arrow, and vice versa.
//     Up Arrow performs as Left Arrow, and vice versa."
// ═══════════════════════════════════════════════════════════════════

describe("APG Listbox: Horizontal Orientation", () => {
    function horizontalListbox(focusedItem = "apple") {
        const t = createTestKernel();
        t.setItems(ITEMS);
        t.setConfig({
            navigate: {
                orientation: "horizontal",
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
        });
        t.setActiveZone("listbox", focusedItem);
        t.dispatch(t.SELECT({ targetId: focusedItem, mode: "replace" }));
        return t;
    }

    // APG: Right Arrow = next (horizontal equivalent of Down Arrow)
    it("Right Arrow: moves focus to next option", () => {
        const t = horizontalListbox("apple");

        t.dispatch(t.NAVIGATE({ direction: "right" }));

        expect(t.focusedItemId()).toBe("banana");
    });

    // APG: Left Arrow = previous (horizontal equivalent of Up Arrow)
    it("Left Arrow: moves focus to previous option", () => {
        const t = horizontalListbox("cherry");

        t.dispatch(t.NAVIGATE({ direction: "left" }));

        expect(t.focusedItemId()).toBe("banana");
    });

    // APG: Down/Up should be ignored in horizontal orientation
    it("Down Arrow: ignored in horizontal listbox", () => {
        const t = horizontalListbox("banana");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("banana"); // unchanged
    });

    it("Up Arrow: ignored in horizontal listbox", () => {
        const t = horizontalListbox("banana");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("banana"); // unchanged
    });
});
