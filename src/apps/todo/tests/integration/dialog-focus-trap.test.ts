/**
 * Dialog Focus Trap — headless reproduction
 *
 * Issue: After Backspace opens the delete dialog, ArrowDown/Up
 * still navigates the list behind it. The overlay should block
 * navigation commands to the background zone.
 *
 * Test strategy:
 *   1. Simulate Backspace → pendingDeleteIds + overlay open
 *   2. Press ArrowDown → focusedItemId must NOT change
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TodoApp, addTodo } from "@apps/todo/app";
import { ListView } from "@apps/todo/widgets/ListView";
import { createPage } from "@os/defineApp.page";
import type { AppPage } from "@os/defineApp.types";
import { OS_OVERLAY_OPEN, OS_OVERLAY_CLOSE } from "@os/3-commands/overlay/overlay";
import { os } from "@/os/kernel";

type TodoState = ReturnType<typeof TodoApp.create>["state"];
type Page = AppPage<TodoState>;

let page: Page;
let now = 5000;

beforeEach(() => {
    vi.spyOn(Date, "now").mockImplementation(() => ++now);
    page = createPage(TodoApp, ListView);
});

afterEach(() => {
    page.cleanup();
});

function addTodos(...texts: string[]): string[] {
    const before = new Set(page.state.data.todoOrder);
    for (const text of texts) {
        page.dispatch(addTodo({ text }));
    }
    return page.state.data.todoOrder.filter((id) => !before.has(id));
}

describe("Dialog Focus Trap", () => {
    it("Backspace → dialog open → ArrowDown must NOT navigate the list", () => {
        const [a, b] = addTodos("First", "Second");
        page.goto("list", {
            items: ["DRAFT", a!, b!],
            focusedItemId: a!,
        });

        // 1. Backspace → pendingDeleteIds
        page.keyboard.press("Backspace");
        expect(page.state.ui.pendingDeleteIds).toContain(a);

        // 2. Simulate overlay open (in browser, Trigger.Portal does this)
        page.dispatch(OS_OVERLAY_OPEN({ id: "todo-delete-dialog", type: "alertdialog" }));
        expect(os.getState().os.overlays.stack).toHaveLength(1);

        // 3. Record focus before ArrowDown
        const focusBefore = page.focusedItemId();

        // 4. ArrowDown — this SHOULD be blocked by the overlay
        page.keyboard.press("ArrowDown");

        // 5. Focus must NOT have changed — dialog traps keyboard
        expect(page.focusedItemId()).toBe(focusBefore);
    });

    it("After overlay closes, ArrowDown resumes normal navigation", () => {
        const [a, b] = addTodos("First", "Second");
        page.goto("list", {
            items: ["DRAFT", a!, b!],
            focusedItemId: a!,
        });

        // Open overlay
        page.dispatch(OS_OVERLAY_OPEN({ id: "todo-delete-dialog", type: "alertdialog" }));
        expect(os.getState().os.overlays.stack).toHaveLength(1);

        // Close overlay
        page.dispatch(OS_OVERLAY_CLOSE({ id: "todo-delete-dialog" }));
        expect(os.getState().os.overlays.stack).toHaveLength(0);

        // ArrowDown should work again
        page.keyboard.press("ArrowDown");
        expect(page.focusedItemId()).toBe(b);
    });
});
