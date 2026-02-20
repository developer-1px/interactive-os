/**
 * APG Dialog (Modal) Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey (user action simulation)
 *   Assert: attrs() → tabIndex (ARIA contract) + state verification
 *
 * Config: vertical, Tab=trap, Escape=close
 * Unique: focus trap (Tab cycling), STACK restore, nested LIFO
 */

import { describe, expect, it } from "vitest";
import { createTestOsKernel } from "../integration/helpers/createTestOsKernel";
import { assertEscapeClose, assertTabTrap } from "./helpers/contracts";

// ─── Config ───

const DIALOG_ITEMS = ["close-btn", "input-name", "input-email", "save-btn"];

const DIALOG_CONFIG = {
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
    dismiss: { escape: "close" as const, outsideClick: "none" as const },
};

function createDialog(focusedItem = "close-btn") {
    const t = createTestOsKernel();
    t.setItems(DIALOG_ITEMS);
    t.setConfig(DIALOG_CONFIG);
    t.setActiveZone("dialog", focusedItem);
    return t;
}

// ═══════════════════════════════════════════════════
// Shared contracts (pressKey via contracts.ts)
// ═══════════════════════════════════════════════════

describe("APG Dialog: Focus Trap", () => {
    assertTabTrap(createDialog, {
        firstId: "close-btn",
        lastId: "save-btn",
        factoryAtFirst: () => createDialog("close-btn"),
        factoryAtLast: () => createDialog("save-btn"),
    });

    it("Tab cycles through all elements without escaping", () => {
        const t = createDialog();
        t.pressKey("Tab");
        expect(t.focusedItemId()).toBe("input-name");
        expect(t.attrs("input-name").tabIndex).toBe(0);
        t.pressKey("Tab");
        expect(t.focusedItemId()).toBe("input-email");
        t.pressKey("Tab");
        expect(t.focusedItemId()).toBe("save-btn");
        t.pressKey("Tab");
        expect(t.focusedItemId()).toBe("close-btn");
        expect(t.activeZoneId()).toBe("dialog");
    });
});

describe("APG Dialog: Escape", () => {
    assertEscapeClose(createDialog);
});

// ═══════════════════════════════════════════════════
// Unique: Focus Restore via STACK (pressKey for Escape)
// ═══════════════════════════════════════════════════

describe("APG Dialog: Focus Restore", () => {
    it("on close, focus restores to invoker", () => {
        const t = createTestOsKernel();
        t.setItems(["new-btn", "edit-btn", "delete-btn"]);
        t.setActiveZone("toolbar", "edit-btn");
        t.dispatch(t.OS_STACK_PUSH());
        t.setItems(DIALOG_ITEMS);
        t.setConfig(DIALOG_CONFIG);
        t.setActiveZone("dialog", "close-btn");
        // Close dialog via stack pop (internal OS mechanism)
        t.dispatch(t.OS_STACK_POP());
        expect(t.activeZoneId()).toBe("toolbar");
        expect(t.focusedItemId("toolbar")).toBe("edit-btn");
    });

    it("nested dialogs: LIFO focus restore", () => {
        const t = createTestOsKernel();
        t.setItems(["btn-1"]);
        t.setActiveZone("toolbar", "btn-1");
        t.dispatch(t.OS_STACK_PUSH());
        t.setItems(["d1-close", "d1-ok"]);
        t.setActiveZone("dialog-1", "d1-close");
        t.dispatch(t.OS_STACK_PUSH());
        t.setItems(["d2-yes", "d2-no"]);
        t.setActiveZone("dialog-2", "d2-yes");
        t.dispatch(t.OS_STACK_POP());
        expect(t.activeZoneId()).toBe("dialog-1");
        t.dispatch(t.OS_STACK_POP());
        expect(t.activeZoneId()).toBe("toolbar");
        expect(t.focusedItemId("toolbar")).toBe("btn-1");
    });
});
