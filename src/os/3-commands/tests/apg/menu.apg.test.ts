/**
 * APG Menu Button Pattern — Contract Test
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *
 * Config: vertical, no-loop, select=none, Tab=trap, Escape=close
 * Unique: action-only (no selection state), popup lifecycle
 */

import { describe } from "vitest";
import { createTestOsKernel } from "../integration/helpers/createTestOsKernel";
import {
    assertBoundaryClamp,
    assertEscapeClose,
    assertFocusRestore,
    assertHomeEnd,
    assertNoSelection,
    assertVerticalNav,
} from "./helpers/contracts";

// ─── Config ───

const MENU_ITEMS = ["cut", "copy", "paste", "select-all"];

const MENU_CONFIG = {
    navigate: {
        orientation: "vertical" as const,
        loop: false,
        seamless: false,
        typeahead: false,
        entry: "first" as const,
        recovery: "next" as const,
    },
    select: {
        mode: "none" as const,
        followFocus: false,
        disallowEmpty: false,
        range: false,
        toggle: false,
    },
    tab: { behavior: "trap" as const, restoreFocus: false },
    dismiss: { escape: "close" as const, outsideClick: "close" as const },
};

function createMenu(focusedItem = "cut") {
    const t = createTestOsKernel();
    t.setItems(["menu-btn"]);
    t.setActiveZone("toolbar", "menu-btn");
    t.dispatch(t.STACK_PUSH());
    t.setItems(MENU_ITEMS);
    t.setConfig(MENU_CONFIG);
    t.setActiveZone("menu", focusedItem);
    return t;
}

// ═══════════════════════════════════════════════════
// Shared contracts
// ═══════════════════════════════════════════════════

describe("APG Menu: Navigation", () => {
    assertVerticalNav(createMenu);
    assertBoundaryClamp(createMenu, {
        firstId: "cut",
        lastId: "select-all",
        axis: "vertical",
    });
    assertHomeEnd(createMenu, { firstId: "cut", lastId: "select-all" });
    assertNoSelection(createMenu);
});

describe("APG Menu: Dismiss", () => {
    assertEscapeClose(createMenu);
    assertFocusRestore(createMenu, {
        invokerZoneId: "toolbar",
        invokerItemId: "menu-btn",
    });
});
