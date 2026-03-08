/**
 * KeyboardInput Isomorphism Contract Test
 *
 * Verifies that buildKeyboardInput (headless) produces the correct
 * KeyboardInput field values for each OS state scenario.
 *
 * Purpose: Detect drift between headless simulate and browser sense.
 * If one side changes a field derivation, this test fails immediately.
 *
 * @see zero-drift.md — L4 Sense Isomorphism
 * @see BOARD.md — WP5
 */

import { TodoApp } from "@apps/todo/app";
import { createHeadlessPage } from "@os-devtool/testing/page";
import { buildKeyboardInput } from "@os-devtool/testing/simulate";
import type { AppPageInternal } from "@os-sdk/app/defineApp/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import TodoPage from "../../../src/pages/TodoPage";

type P = AppPageInternal<any>;
let page: P;

beforeEach(() => {
    page = createHeadlessPage(TodoApp, TodoPage);
    page.goto("/");
});

afterEach(() => {
    page.cleanup();
});

/** Helper: focus first item in list zone */
function setupListFocus() {
    page.locator("#todo_1").click();
}

/** Helper: enter editing mode on focused item */
function enterEditing() {
    page.keyboard.press("Enter"); // OS_ACTIVATE → startEditTodo → OS_FIELD_START_EDIT
}

describe("KeyboardInput isomorphism: buildKeyboardInput contract", () => {
    // ─── Navigating state (no editing) ───

    describe("navigating state", () => {
        it("ArrowDown produces correct core fields", () => {
            setupListFocus();

            const input = buildKeyboardInput(page.kernel, "ArrowDown");

            expect(input.canonicalKey).toBe("ArrowDown");
            expect(input.key).toBe("ArrowDown");
            expect(input.isEditing).toBe(false);
            expect(input.isFieldActive).toBe(false);
            expect(input.editingFieldId).toBeNull();
            expect(input.focusedItemId).toBe("todo_1");
        });

        it("cursor is populated when item is focused", () => {
            setupListFocus();

            const input = buildKeyboardInput(page.kernel, "ArrowDown");

            expect(input.cursor).not.toBeNull();
            expect(input.cursor!.focusId).toBe("todo_1");
            expect(input.cursor!.selection).toEqual(expect.any(Array));
        });

        it("Space in navigating state: isFieldActive is false", () => {
            setupListFocus();

            const input = buildKeyboardInput(page.kernel, "Space");

            expect(input.isEditing).toBe(false);
            expect(input.isFieldActive).toBe(false);
        });

        it("guard fields default to safe values", () => {
            setupListFocus();

            const input = buildKeyboardInput(page.kernel, "ArrowDown");

            expect(input.isComposing).toBe(false);
            expect(input.isDefaultPrevented).toBe(false);
            expect(input.isCombobox).toBe(false);
        });

        it("trigger fields are null in headless", () => {
            setupListFocus();

            const input = buildKeyboardInput(page.kernel, "ArrowDown");

            expect(input.focusedTriggerId).toBeNull();
            expect(input.focusedTriggerRole).toBeNull();
            expect(input.focusedTriggerOverlayId).toBeNull();
            expect(input.isTriggerOverlayOpen).toBe(false);
        });
    });

    // ─── Editing state (Enter activates → startEditTodo → OS_FIELD_START_EDIT) ───

    describe("deferred editing state", () => {
        it("Enter during editing: isFieldActive is false (OS action key)", () => {
            setupListFocus();
            enterEditing();

            const input = buildKeyboardInput(page.kernel, "Enter");

            expect(input.isEditing).toBe(true);
            expect(input.editingFieldId).toBe("todo_1");
            // Enter is NOT in INLINE_ZONE_PASSTHROUGH → field absorbs it
            // resolveFieldKey handles Enter → OS_FIELD_COMMIT
            expect(input.isFieldActive).toBe(true);
        });

        it("letter key during editing: isFieldActive is true (field absorbs)", () => {
            setupListFocus();
            enterEditing();

            const input = buildKeyboardInput(page.kernel, "a");

            expect(input.isEditing).toBe(true);
            // Letter keys are NOT delegated to OS → field absorbs → isFieldActive = true
            expect(input.isFieldActive).toBe(true);
        });

        it("ArrowDown during editing: isFieldActive is false (OS navigates)", () => {
            setupListFocus();
            enterEditing();

            const input = buildKeyboardInput(page.kernel, "ArrowDown");

            expect(input.isEditing).toBe(true);
            // ArrowDown IS delegated to OS for inline fields
            expect(input.isFieldActive).toBe(false);
        });

        it("Escape during editing: isFieldActive is false (OS cancels)", () => {
            setupListFocus();
            enterEditing();

            const input = buildKeyboardInput(page.kernel, "Escape");

            expect(input.isEditing).toBe(true);
            // Escape is NOT in INLINE_ZONE_PASSTHROUGH → field absorbs it
            // resolveFieldKey handles Escape → OS_FIELD_CANCEL
            expect(input.isFieldActive).toBe(true);
        });
    });

    // ─── Interface shape ───

    describe("interface shape", () => {
        it("KeyboardInput has exactly 18 fields (dead fields removed)", () => {
            setupListFocus();

            const input = buildKeyboardInput(page.kernel, "ArrowDown");
            const keys = Object.keys(input);

            // 21 original - 3 dead (focusedItemRole, focusedItemExpanded, isInspector) = 18
            expect(keys).toHaveLength(18);
        });

        it("does NOT contain removed dead fields", () => {
            setupListFocus();

            const input = buildKeyboardInput(page.kernel, "ArrowDown") as Record<string, unknown>;

            expect(input).not.toHaveProperty("focusedItemRole");
            expect(input).not.toHaveProperty("focusedItemExpanded");
        });
    });
});
