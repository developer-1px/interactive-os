/**
 * APG Radio Group Pattern — Contract Test (Headless Kernel)
 *
 * Source of Truth: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * RadioGroup = vertical/horizontal single-select with:
 *   - Arrow keys move AND select (immediate activation)
 *   - Never empty: always one option selected
 *   - Space checks the focused radio (if not already)
 *   - Tab moves focus to/from the group (only selected radio is in tab order)
 *
 * Structure:
 *   1. Arrow Navigation with Immediate Selection
 *   2. Loop (wrap at boundaries)
 *   3. Space (check focused radio)
 *   4. Both orientations
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "../integration/helpers/createTestKernel";

// ─── Helpers ───

const RADIO_ITEMS = ["radio-sm", "radio-md", "radio-lg", "radio-xl"];

/** RadioGroup config: single-select, followFocus, loop, disallowEmpty */
const RADIO_CONFIG = {
    navigate: {
        orientation: "vertical" as const,
        loop: true,
        seamless: false,
        typeahead: false,
        entry: "selected" as const,
        recovery: "next" as const,
    },
    select: {
        mode: "single" as const,
        followFocus: true,
        disallowEmpty: true,
        range: false,
        toggle: false,
    },
};

function createRadioGroup(selected = "radio-sm") {
    const t = createTestKernel();
    t.setItems(RADIO_ITEMS);
    t.setConfig(RADIO_CONFIG);
    t.setActiveZone("radiogroup", selected);
    t.dispatch(t.SELECT({ targetId: selected, mode: "replace" }));
    return t;
}

// ═══════════════════════════════════════════════════════════════════
// 1. APG RadioGroup: Navigation + Immediate Selection
//    "Down Arrow: focus moves to next radio, selects it."
//    "Up Arrow: focus moves to previous radio, selects it."
// ═══════════════════════════════════════════════════════════════════

describe("APG RadioGroup: Navigate + Select", () => {
    it("Down Arrow: moves focus and selects next radio", () => {
        const t = createRadioGroup("radio-sm");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("radio-md");
        expect(t.selection()).toEqual(["radio-md"]);
    });

    it("Up Arrow: moves focus and selects previous radio", () => {
        const t = createRadioGroup("radio-lg");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("radio-md");
        expect(t.selection()).toEqual(["radio-md"]);
    });

    it("sequential: selection moves with every keystroke", () => {
        const t = createRadioGroup("radio-sm");

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.selection()).toEqual(["radio-md"]);

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.selection()).toEqual(["radio-lg"]);

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.selection()).toEqual(["radio-xl"]);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. APG RadioGroup: Loop
//    "If focus is on the last radio, Down Arrow moves to first."
//    "If focus is on the first radio, Up Arrow moves to last."
// ═══════════════════════════════════════════════════════════════════

describe("APG RadioGroup: Loop", () => {
    it("Down at last: wraps to first + selects", () => {
        const t = createRadioGroup("radio-xl");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("radio-sm");
        expect(t.selection()).toEqual(["radio-sm"]);
    });

    it("Up at first: wraps to last + selects", () => {
        const t = createRadioGroup("radio-sm");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("radio-xl");
        expect(t.selection()).toEqual(["radio-xl"]);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. APG RadioGroup: Never Empty
//    "One radio button in the group is always checked."
// ═══════════════════════════════════════════════════════════════════

describe("APG RadioGroup: Never Empty", () => {
    it("always has exactly one selection after navigation", () => {
        const t = createRadioGroup("radio-md");

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.selection()).toHaveLength(1);

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.selection()).toHaveLength(1);

        t.dispatch(t.NAVIGATE({ direction: "up" }));
        expect(t.selection()).toHaveLength(1);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 4. APG RadioGroup: Home / End
// ═══════════════════════════════════════════════════════════════════

describe("APG RadioGroup: Home / End", () => {
    it("Home: moves to first and selects", () => {
        const t = createRadioGroup("radio-lg");

        t.dispatch(t.NAVIGATE({ direction: "home" }));

        expect(t.focusedItemId()).toBe("radio-sm");
        expect(t.selection()).toEqual(["radio-sm"]);
    });

    it("End: moves to last and selects", () => {
        const t = createRadioGroup("radio-sm");

        t.dispatch(t.NAVIGATE({ direction: "end" }));

        expect(t.focusedItemId()).toBe("radio-xl");
        expect(t.selection()).toEqual(["radio-xl"]);
    });
});
