/**
 * APG Combobox Pattern — Contract Test
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * Composite: Input (combobox) + Popup (listbox)
 * Config: vertical, followFocus, Tab=trap, Escape=close
 * Unique: popup lifecycle via STACK, selection in popup
 */

import { describe } from "vitest";
import { createTestOsKernel } from "../integration/helpers/createTestOsKernel";
import {
    assertBoundaryClamp,
    assertEscapeClose,
    assertFocusRestore,
    assertFollowFocus,
    assertHomeEnd,
    assertVerticalNav,
} from "./helpers/contracts";

// ─── Config ───

const POPUP_ITEMS = ["apple", "banana", "cherry", "date", "elderberry"];

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
    tab: { behavior: "trap" as const, restoreFocus: false },
    dismiss: { escape: "close" as const, outsideClick: "close" as const },
};

function createComboboxPopup(focusedItem = "apple") {
    const t = createTestOsKernel();
    t.setItems(["input-field"]);
    t.setActiveZone("combobox", "input-field");
    t.dispatch(t.STACK_PUSH());
    t.setItems(POPUP_ITEMS);
    t.setConfig(POPUP_CONFIG);
    t.setActiveZone("popup", focusedItem);
    return t;
}

// ═══════════════════════════════════════════════════
// Shared contracts
// ═══════════════════════════════════════════════════

describe("APG Combobox: Popup Navigation", () => {
    assertVerticalNav(createComboboxPopup);
    assertBoundaryClamp(createComboboxPopup, {
        firstId: "apple",
        lastId: "elderberry",
        axis: "vertical",
    });
    assertHomeEnd(createComboboxPopup, {
        firstId: "apple",
        lastId: "elderberry",
    });
    assertFollowFocus(createComboboxPopup);
});

describe("APG Combobox: Dismiss", () => {
    assertEscapeClose(createComboboxPopup);
    assertFocusRestore(createComboboxPopup, {
        invokerZoneId: "combobox",
        invokerItemId: "input-field",
    });
});
