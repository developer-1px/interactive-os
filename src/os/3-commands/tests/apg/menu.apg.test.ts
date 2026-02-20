/**
 * APG Menu Button Pattern — Contract Test (Headless Kernel)
 *
 * Source of Truth: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *                  https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 *
 * Menu is a vertical listbox-like popup opened by a button.
 * Key differences from Listbox:
 *   - Escape = close menu + restore focus to invoker
 *   - No selection state — activation (Enter/Space) performs action
 *   - Focus trap: Tab does NOT exit, only Escape
 *
 * Structure:
 *   1. Menu Navigation (Up/Down)
 *   2. Escape (close menu, restore focus)
 *   3. Boundary Behavior
 *   4. Home / End
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "../integration/helpers/createTestKernel";

// ─── Helpers ───

const MENU_ITEMS = ["cut", "copy", "paste", "select-all"];

/** Menu config: vertical, no loop, Escape=close, no selection (action-only) */
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
    tab: {
        behavior: "trap" as const,
        restoreFocus: false,
    },
    dismiss: {
        escape: "close" as const,
        outsideClick: "close" as const,
    },
};

/** Create menu: push stack (button context), then open menu zone */
function createMenu(focusedItem = "cut") {
    const t = createTestKernel();

    // Button that triggered the menu
    t.setItems(["menu-btn"]);
    t.setActiveZone("toolbar", "menu-btn");
    t.dispatch(t.STACK_PUSH());

    // Menu opens
    t.setItems(MENU_ITEMS);
    t.setConfig(MENU_CONFIG);
    t.setActiveZone("menu", focusedItem);

    return t;
}

// ═══════════════════════════════════════════════════════════════════
// 1. APG Menu: Navigation
//    "Down Arrow: moves focus to the next item."
//    "Up Arrow: moves focus to the previous item."
// ═══════════════════════════════════════════════════════════════════

describe("APG Menu: Navigation", () => {
    it("Down Arrow: moves focus to next menu item", () => {
        const t = createMenu("cut");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("copy");
    });

    it("Up Arrow: moves focus to previous menu item", () => {
        const t = createMenu("paste");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("copy");
    });

    it("sequential navigation", () => {
        const t = createMenu("cut");

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("select-all");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. APG Menu: Escape
//    "Escape: closes the menu, returns focus to the button."
// ═══════════════════════════════════════════════════════════════════

describe("APG Menu: Escape", () => {
    it("Escape: closes the menu", () => {
        const t = createMenu("copy");

        t.dispatch(t.ESCAPE());

        expect(t.activeZoneId()).toBeNull();
    });

    it("Escape + STACK_POP: restores focus to invoking button", () => {
        const t = createMenu("paste");

        t.dispatch(t.ESCAPE());
        t.dispatch(t.STACK_POP());

        expect(t.activeZoneId()).toBe("toolbar");
        expect(t.focusedItemId("toolbar")).toBe("menu-btn");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. APG Menu: No Selection
//    Menu items don't have selection state — they trigger actions.
// ═══════════════════════════════════════════════════════════════════

describe("APG Menu: No Selection", () => {
    it("navigating does not create selection", () => {
        const t = createMenu("cut");

        t.dispatch(t.NAVIGATE({ direction: "down" }));
        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("paste");
        expect(t.selection()).toEqual([]); // no selection in menu
    });
});

// ═══════════════════════════════════════════════════════════════════
// 4. APG Menu: Boundary
//    "If focus is on the last item, does nothing."
// ═══════════════════════════════════════════════════════════════════

describe("APG Menu: Boundary", () => {
    it("Down at last: stays", () => {
        const t = createMenu("select-all");

        t.dispatch(t.NAVIGATE({ direction: "down" }));

        expect(t.focusedItemId()).toBe("select-all");
    });

    it("Up at first: stays", () => {
        const t = createMenu("cut");

        t.dispatch(t.NAVIGATE({ direction: "up" }));

        expect(t.focusedItemId()).toBe("cut");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 5. APG Menu: Home / End
// ═══════════════════════════════════════════════════════════════════

describe("APG Menu: Home / End", () => {
    it("Home: moves to first item", () => {
        const t = createMenu("paste");
        t.dispatch(t.NAVIGATE({ direction: "home" }));
        expect(t.focusedItemId()).toBe("cut");
    });

    it("End: moves to last item", () => {
        const t = createMenu("cut");
        t.dispatch(t.NAVIGATE({ direction: "end" }));
        expect(t.focusedItemId()).toBe("select-all");
    });
});
