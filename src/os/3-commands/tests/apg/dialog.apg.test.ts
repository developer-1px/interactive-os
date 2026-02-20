/**
 * APG Dialog (Modal) Pattern — Contract Test (Headless Kernel)
 *
 * Source of Truth: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * Verifies that the Interaction OS satisfies the W3C APG Dialog
 * keyboard interaction contract using headless kernel dispatch.
 *
 * Structure:
 *   1. Focus Trap (Tab cycling)
 *   2. Escape (close dialog)
 *   3. Focus Restore (on close, focus returns to invoker)
 */

import { describe, expect, it } from "vitest";
import { createTestKernel } from "../integration/helpers/createTestKernel";

// ─── Helpers ───

/** Dialog config: Tab = trap, Escape = close */
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
    tab: {
        behavior: "trap" as const,
        restoreFocus: false,
    },
    dismiss: {
        escape: "close" as const,
        outsideClick: "none" as const,
    },
};

const DIALOG_ITEMS = ["close-btn", "input-name", "input-email", "save-btn"];

function createDialog() {
    const t = createTestKernel();
    t.setItems(DIALOG_ITEMS);
    t.setConfig(DIALOG_CONFIG);
    t.setActiveZone("dialog", "close-btn");
    return t;
}

// ═══════════════════════════════════════════════════════════════════
// 1. APG Dialog: Focus Trap (Tab cycling)
//    "Tab: Moves focus to the next tabbable element inside the dialog.
//     If focus is on the last tabbable element, moves focus to the first."
//    "Shift+Tab: Moves focus to the previous tabbable element.
//     If focus is on the first tabbable element, moves focus to the last."
// ═══════════════════════════════════════════════════════════════════

describe("APG Dialog: Focus Trap", () => {
    it("Tab: moves focus to next element inside dialog", () => {
        const t = createDialog();

        t.dispatch(t.TAB({ direction: "forward" }));

        expect(t.focusedItemId()).toBe("input-name");
        expect(t.activeZoneId()).toBe("dialog"); // still in dialog
    });

    it("Tab at last element: wraps to first (focus trap)", () => {
        const t = createDialog();
        t.setActiveZone("dialog", "save-btn"); // last element

        t.dispatch(t.TAB({ direction: "forward" }));

        expect(t.focusedItemId()).toBe("close-btn"); // wrapped to first
        expect(t.activeZoneId()).toBe("dialog");
    });

    it("Shift+Tab: moves focus to previous element", () => {
        const t = createDialog();
        t.setActiveZone("dialog", "input-email");

        t.dispatch(t.TAB({ direction: "backward" }));

        expect(t.focusedItemId()).toBe("input-name");
        expect(t.activeZoneId()).toBe("dialog");
    });

    it("Shift+Tab at first element: wraps to last (focus trap)", () => {
        const t = createDialog();
        t.setActiveZone("dialog", "close-btn"); // first element

        t.dispatch(t.TAB({ direction: "backward" }));

        expect(t.focusedItemId()).toBe("save-btn"); // wrapped to last
        expect(t.activeZoneId()).toBe("dialog");
    });

    it("Tab cycles through all elements without escaping", () => {
        const t = createDialog();

        // Full cycle: close-btn → input-name → input-email → save-btn → close-btn
        t.dispatch(t.TAB({ direction: "forward" }));
        expect(t.focusedItemId()).toBe("input-name");

        t.dispatch(t.TAB({ direction: "forward" }));
        expect(t.focusedItemId()).toBe("input-email");

        t.dispatch(t.TAB({ direction: "forward" }));
        expect(t.focusedItemId()).toBe("save-btn");

        t.dispatch(t.TAB({ direction: "forward" }));
        expect(t.focusedItemId()).toBe("close-btn"); // back to start

        // All within dialog
        expect(t.activeZoneId()).toBe("dialog");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. APG Dialog: Escape
//    "Escape: Closes the dialog."
// ═══════════════════════════════════════════════════════════════════

describe("APG Dialog: Escape", () => {
    it("Escape: closes the dialog (clears activeZoneId)", () => {
        const t = createDialog();

        t.dispatch(t.ESCAPE());

        // Dialog is closed — activeZoneId cleared, focusedItemId cleared
        expect(t.activeZoneId()).toBeNull();
        expect(t.focusedItemId("dialog")).toBeNull();
    });

    it("Escape from any position: closes the dialog", () => {
        const t = createDialog();
        t.setActiveZone("dialog", "input-email"); // mid-dialog

        t.dispatch(t.ESCAPE());

        expect(t.activeZoneId()).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. APG Dialog: Focus Restore
//    "When a dialog closes, focus returns to the element that
//     invoked the dialog."
//    Uses STACK_PUSH (on open) and STACK_POP (on close).
// ═══════════════════════════════════════════════════════════════════

describe("APG Dialog: Focus Restore", () => {
    it("on close, focus restores to the invoking element", () => {
        const t = createTestKernel();

        // 1. User is focused on "edit-btn" in "toolbar"
        t.setItems(["new-btn", "edit-btn", "delete-btn"]);
        t.setActiveZone("toolbar", "edit-btn");

        // 2. Push focus stack (simulating dialog open)
        t.dispatch(t.STACK_PUSH());

        // 3. Dialog opens — focus moves to dialog
        t.setItems(DIALOG_ITEMS);
        t.setConfig(DIALOG_CONFIG);
        t.setActiveZone("dialog", "close-btn");
        expect(t.activeZoneId()).toBe("dialog");

        // 4. Pop focus stack (simulating dialog close)
        t.dispatch(t.STACK_POP());

        // 5. Focus should return to "edit-btn" in "toolbar"
        expect(t.activeZoneId()).toBe("toolbar");
        expect(t.focusedItemId("toolbar")).toBe("edit-btn");
    });

    it("nested dialogs: LIFO focus restore", () => {
        const t = createTestKernel();

        // 1. Start at toolbar
        t.setItems(["btn-1"]);
        t.setActiveZone("toolbar", "btn-1");

        // 2. Push + open dialog 1
        t.dispatch(t.STACK_PUSH());
        t.setItems(["d1-close", "d1-ok"]);
        t.setActiveZone("dialog-1", "d1-close");

        // 3. Push + open dialog 2 (nested)
        t.dispatch(t.STACK_PUSH());
        t.setItems(["d2-yes", "d2-no"]);
        t.setActiveZone("dialog-2", "d2-yes");

        expect(t.activeZoneId()).toBe("dialog-2");

        // 4. Close dialog 2 → back to dialog 1
        t.dispatch(t.STACK_POP());
        expect(t.activeZoneId()).toBe("dialog-1");
        expect(t.focusedItemId("dialog-1")).toBe("d1-close");

        // 5. Close dialog 1 → back to toolbar
        t.dispatch(t.STACK_POP());
        expect(t.activeZoneId()).toBe("toolbar");
        expect(t.focusedItemId("toolbar")).toBe("btn-1");
    });
});
