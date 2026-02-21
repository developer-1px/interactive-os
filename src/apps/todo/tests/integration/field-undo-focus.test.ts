/**
 * Todo Integration: Field Editing Focus + Undo Focus Restoration
 *
 * Tests the OS-level guarantee that:
 * 1. Field commit/cancel restores focus to the edited item
 * 2. Undo restores focus to where it was before the undone action
 *
 * Inspector replay: the bug is that after field commit,
 * focusedItemId stays on "EDIT" (the field element) instead of
 * returning to the item (e.g., "todo_1").
 */

import { beforeEach, describe, expect, it } from "vitest";
import { _resetClipboardStore } from "@/os/collection/createCollectionZone";
import { OS_FIELD_CANCEL, OS_FIELD_COMMIT } from "@/os/3-commands/field/field";
import { os } from "@/os/kernel";
import { produce } from "immer";

/** Set up OS state: activeZoneId + zone focus + editingItemId */
function setupZone(
    zoneId: string,
    itemId: string,
    opts?: { editingItemId?: string },
) {
    os.setState(
        produce((s: any) => {
            s.os.focus.activeZoneId = zoneId;
            const z = (s.os.focus.zones[zoneId] ??= {});
            z.focusedItemId = itemId;
            z.lastFocusedId = itemId;
            z.editingItemId = opts?.editingItemId ?? null;
            z.selection = [itemId];
            z.selectionAnchor = itemId;
            z.stickyX = null;
            z.stickyY = null;
            z.expandedItems ??= [];
        }),
    );
}

/** Simulate focusin on EDIT field, which overwrites focusedItemId */
function simulateFieldFocusin(zoneId: string) {
    os.setState(
        produce((s: any) => {
            const z = s.os.focus.zones[zoneId];
            if (z) {
                z.focusedItemId = "EDIT";
                z.lastFocusedId = "EDIT";
            }
        }),
    );
}

describe("Todo Integration: Field Editing Focus", () => {
    beforeEach(() => {
        _resetClipboardStore();
    });

    /**
     * §F1: Field commit restores focus to edited item
     *
     * Flow: click item → Enter (edit) → focusin EDIT field → Enter (commit)
     *       → focus should return to the original item
     */
    it("§F1: field commit restores focusedItemId to the edited item", () => {
        const todoId = "todo_1";
        setupZone("list", todoId, { editingItemId: todoId });

        // focusin on EDIT field element overwrites focusedItemId
        simulateFieldFocusin("list");
        expect(os.getState().os.focus.zones["list"]?.focusedItemId).toBe("EDIT");

        // Enter → commit → should restore focus to todoId
        os.dispatch(OS_FIELD_COMMIT());
        const zone = os.getState().os.focus.zones["list"]!;
        expect(zone.editingItemId).toBeNull();
        expect(zone.focusedItemId).toBe(todoId);
        expect(zone.lastFocusedId).toBe(todoId);
    });

    /**
     * §F2: Field cancel also restores focus
     */
    it("§F2: field cancel restores focusedItemId to the edited item", () => {
        const todoId = "todo_1";
        setupZone("list", todoId, { editingItemId: todoId });

        // Simulate focusin on field
        simulateFieldFocusin("list");
        expect(os.getState().os.focus.zones["list"]?.focusedItemId).toBe("EDIT");

        // Escape → cancel
        os.dispatch(OS_FIELD_CANCEL());

        const zone = os.getState().os.focus.zones["list"]!;
        expect(zone.editingItemId).toBeNull();
        expect(zone.focusedItemId).toBe(todoId);
        expect(zone.lastFocusedId).toBe(todoId);
    });

    /**
     * §F3: Commit without editingItemId (immediate mode) does not crash
     */
    it("§F3: commit without editingItemId is safe", () => {
        setupZone("list", "todo_1");
        // No editingItemId set

        // Should not throw
        os.dispatch(OS_FIELD_COMMIT());
        expect(os.getState().os.focus.zones["list"]?.focusedItemId).toBe("todo_1");
    });
});
