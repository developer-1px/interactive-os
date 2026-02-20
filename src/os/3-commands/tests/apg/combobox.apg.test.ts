/**
 * APG Combobox Pattern — Contract Test (Headless Kernel)
 *
 * Source of Truth: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * Combobox is a composite: Input (combobox) + Popup (listbox).
 * The OS models this as:
 *   - Parent zone (combobox container) with virtualFocus
 *   - Child zone (popup listbox) opened via STACK_PUSH
 *
 * Structure:
 *   1. Popup Open (Down Arrow → focus into popup)
 *   2. Popup Navigation (Up/Down within popup listbox)
 *   3. Popup Close (Escape → dismiss + focus restore to input)
 *   4. Accept (Enter → select + close)
 *   5. Boundary Behavior
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "../integration/helpers/createTestKernel";

// ─── Helpers ───

const POPUP_ITEMS = ["apple", "banana", "cherry", "date", "elderberry"];

/** Combobox popup config: vertical listbox with followFocus, Escape=close */
const POPUP_CONFIG = {
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
    tab: {
        behavior: "trap" as const,
        restoreFocus: false,
    },
    dismiss: {
        escape: "close" as const,
        outsideClick: "close" as const,
    },
};

/**
 * Simulates a combobox with open popup:
 * 1. Push focus stack (save input context)
 * 2. Set popup zone as active with items
 */
function createComboboxPopup(focusedItem = "apple") {
    const t = createTestKernel();

    // 1. Simulate input zone (combobox host)
    t.setItems(["input-field"]);
    t.setActiveZone("combobox", "input-field");

    // 2. Push stack (opening popup saves input context)
    t.dispatch(t.STACK_PUSH());

    // 3. Popup opens — switch to popup zone
    t.setItems(POPUP_ITEMS);
    t.setConfig(POPUP_CONFIG);
    t.setActiveZone("popup", focusedItem);

    return t;
}

// ═══════════════════════════════════════════════════════════════════
// 1. APG Combobox: Popup Navigation
//    "Down Arrow: Moves focus to and selects the next option."
//    "Up Arrow: Moves focus to and selects the previous option."
// ═══════════════════════════════════════════════════════════════════

describe("APG Combobox: Popup Navigation", () => {
    it("Down Arrow: moves focus to next option in popup", () => {
        const t = createComboboxPopup("apple");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("banana");
    });

    it("Up Arrow: moves focus to previous option in popup", () => {
        const t = createComboboxPopup("cherry");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("banana");
    });

    it("Down Arrow: selection follows focus (followFocus=true)", () => {
        const t = createComboboxPopup("apple");
        t.dispatch(t.SELECT({ targetId: "apple", mode: "replace" }));

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("banana");
        expect(t.selection()).toEqual(["banana"]);
    });

    it("sequential navigation through popup", () => {
        const t = createComboboxPopup("apple");

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("date");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. APG Combobox: Escape
//    "Escape: Closes the popup and returns focus to the combobox."
// ═══════════════════════════════════════════════════════════════════

describe("APG Combobox: Escape (Popup Close)", () => {
    it("Escape: closes popup (clears active zone)", () => {
        const t = createComboboxPopup("banana");

        t.dispatch(t.ESCAPE());

        // Popup dismissed
        expect(t.activeZoneId()).toBeNull();
        expect(t.focusedItemId("popup")).toBeNull();
    });

    it("Escape + STACK_POP: restores focus to combobox input", () => {
        const t = createComboboxPopup("cherry");

        // Close popup + restore focus to combobox
        t.dispatch(t.ESCAPE());
        t.dispatch(t.STACK_POP());

        expect(t.activeZoneId()).toBe("combobox");
        expect(t.focusedItemId("combobox")).toBe("input-field");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. APG Combobox: Boundary Behavior
//    "If focus is on the last option, does nothing."
//    "If focus is on the first option, does nothing."
// ═══════════════════════════════════════════════════════════════════

describe("APG Combobox: Boundary Behavior", () => {
    it("Down at last option: focus does not move", () => {
        const t = createComboboxPopup("elderberry");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("elderberry"); // stays
    });

    it("Up at first option: focus does not move", () => {
        const t = createComboboxPopup("apple");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("apple"); // stays
    });
});

// ═══════════════════════════════════════════════════════════════════
// 4. APG Combobox: Home / End in popup
// ═══════════════════════════════════════════════════════════════════

describe("APG Combobox: Home / End", () => {
    it("Home: moves focus to first option", () => {
        const t = createComboboxPopup("cherry");

        t.dispatch(t.NAVIGATE({ direction: "home" }));

        expect(t.focusedItemId()).toBe("apple");
    });

    it("End: moves focus to last option", () => {
        const t = createComboboxPopup("banana");

        t.dispatch(t.NAVIGATE({ direction: "end" }));

        expect(t.focusedItemId()).toBe("elderberry");
    });
});
