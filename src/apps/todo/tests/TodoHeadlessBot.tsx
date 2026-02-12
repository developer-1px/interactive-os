/**
 * TodoHeadlessBot — Headless (DOM-free) Tests for Todo App
 *
 * Unlike TodoBot, these tests exercise the kernel directly via
 * `dispatch` → `getState()` without any DOM interaction.
 *
 * Purpose:
 * 1. Verify all commands as pure state transitions
 * 2. Validate selectors produce correct derived data
 * 3. Test clipboard as pure state (no navigator.clipboard)
 * 4. Test undo/redo via kernel
 * 5. Serve as "customer requirements" for kernel/OS (Outside-In TDD)
 */

import type { TestBot } from "@inspector/testbot";

import { kernel } from "@/os-new/kernel";
import { todoSlice } from "@apps/todo/app";
import type { AppState } from "@apps/todo/model/appState";

// ── Commands ──
import {
    AddTodo,
    CancelEdit,
    ClearCompleted,
    DeleteTodo,
    MoveItemDown,
    MoveItemUp,
    StartEdit,
    SyncDraft,
    SyncEditDraft,
    ToggleTodo,
    UpdateTodoText,
} from "@apps/todo/features/commands/list";
import {
    DuplicateTodo,
} from "@apps/todo/features/commands/clipboard";
import {
    MoveCategoryDown,
    MoveCategoryUp,
    SelectCategory,
} from "@apps/todo/features/commands/MoveCategoryUp";
import { ToggleView } from "@apps/todo/features/commands/ToggleView";
import {
    UndoCommand,
    RedoCommand,
} from "@apps/todo/features/commands/history";

// ── Selectors ──
import {
    selectCategories,
    selectEditingTodo,
    selectStats,
    selectTodosByCategory,
    selectVisibleTodos,
} from "@apps/todo/selectors";

import { useTestBotRoutes } from "@inspector/testbot";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function snapshot() {
    return kernel.getState();
}
function restore(s: any) {
    if (s) kernel.setState(() => s);
}

/** Get todo app state (scoped). */
function appState(): AppState {
    return todoSlice.getState();
}

/** Dispatch a command to the kernel. */
function d(cmd: any) {
    kernel.dispatch(cmd);
}

// ═══════════════════════════════════════════════════════════════════
// Test Definitions
// ═══════════════════════════════════════════════════════════════════

function defineHeadlessTests(bot: TestBot) {
    // ─────────────────────────────────────────────────────────────
    // 1. CRUD — Add, Delete, Toggle
    // ─────────────────────────────────────────────────────────────

    bot.describe("Headless CRUD: AddTodo creates item in current category", async (t) => {
        const s = snapshot();
        try {
            const before = selectVisibleTodos(appState());
            const beforeLen = before.length;

            d(SyncDraft({ text: "Buy milk" }));
            d(AddTodo({}));

            const after = selectVisibleTodos(appState());
            await t.assert(after.length === beforeLen + 1, `Todo count: ${beforeLen} → ${after.length}`);
            await t.assert(after.some(t => t.text === "Buy milk"), "New todo has correct text");
            await t.assert(appState().ui.draft === "", "Draft cleared after add");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless CRUD: AddTodo with explicit text (no draft)", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Explicit text" }));

            const todos = selectVisibleTodos(appState());
            await t.assert(todos.some(t => t.text === "Explicit text"), "Created with explicit text");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless CRUD: AddTodo with empty text does nothing", async (t) => {
        const s = snapshot();
        try {
            const before = selectVisibleTodos(appState()).length;

            d(SyncDraft({ text: "" }));
            d(AddTodo({}));

            const after = selectVisibleTodos(appState()).length;
            await t.assert(after === before, `Count unchanged: ${before} === ${after}`);
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless CRUD: DeleteTodo removes item", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Delete me" }));
            const todos = selectVisibleTodos(appState());
            const target = todos.find(t => t.text === "Delete me")!;

            d(DeleteTodo({ id: target.id }));

            const after = selectVisibleTodos(appState());
            await t.assert(!after.some(t => t.text === "Delete me"), "Deleted todo not found");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless CRUD: ToggleTodo flips completed", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Toggle me" }));
            const id = selectVisibleTodos(appState()).find(t => t.text === "Toggle me")!.id;

            // Toggle ON
            d(ToggleTodo({ id }));
            await t.assert(appState().data.todos[id]!.completed === true, "Toggled to completed");

            // Toggle OFF
            d(ToggleTodo({ id }));
            await t.assert(appState().data.todos[id]!.completed === false, "Toggled back to active");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless CRUD: ClearCompleted removes only completed", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Keep" }));
            d(AddTodo({ text: "Clear" }));
            const clearId = selectVisibleTodos(appState()).find(t => t.text === "Clear")!.id;
            d(ToggleTodo({ id: clearId }));

            d(ClearCompleted());

            const todos = selectVisibleTodos(appState());
            await t.assert(todos.some(t => t.text === "Keep"), "Active todo kept");
            await t.assert(!todos.some(t => t.text === "Clear"), "Completed todo cleared");
        } finally {
            restore(s);
        }
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Editing Flow
    // ─────────────────────────────────────────────────────────────

    bot.describe("Headless Edit: Start → Sync → Save", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Original" }));
            const id = selectVisibleTodos(appState()).find(t => t.text === "Original")!.id;

            // Start edit
            d(StartEdit({ id }));
            await t.assert(appState().ui.editingId === id, "editingId set");
            await t.assert(appState().ui.editDraft === "Original", "editDraft initialized");

            // Modify
            d(SyncEditDraft({ text: "Modified" }));
            await t.assert(appState().ui.editDraft === "Modified", "editDraft updated");

            // Save (UpdateTodoText as current commit)
            d(UpdateTodoText({ text: "Modified" }));
            await t.assert(appState().data.todos[id]!.text === "Modified", "Text saved");
            await t.assert(appState().ui.editingId === null, "editingId cleared");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless Edit: Cancel preserves original", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Keep Me" }));
            const id = selectVisibleTodos(appState()).find(t => t.text === "Keep Me")!.id;

            d(StartEdit({ id }));
            d(SyncEditDraft({ text: "Changed" }));
            d(CancelEdit());

            await t.assert(appState().data.todos[id]!.text === "Keep Me", "Original text preserved");
            await t.assert(appState().ui.editingId === null, "editingId cleared");
        } finally {
            restore(s);
        }
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Selectors
    // ─────────────────────────────────────────────────────────────

    bot.describe("Headless Selectors: selectVisibleTodos filters by category", async (t) => {
        const s = snapshot();
        try {
            // Select "cat_work" category
            d(SelectCategory({ id: "cat_work" }));
            const workTodos = selectVisibleTodos(appState());
            await t.assert(
                workTodos.every(t => t.categoryId === "cat_work"),
                "All visible todos belong to selected category"
            );

            // Select "cat_inbox"
            d(SelectCategory({ id: "cat_inbox" }));
            const inboxTodos = selectVisibleTodos(appState());
            await t.assert(
                inboxTodos.every(t => t.categoryId === "cat_inbox"),
                "Category switch shows different todos"
            );
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless Selectors: selectCategories preserves order", async (t) => {
        const s = snapshot();
        try {
            const categories = selectCategories(appState());
            await t.assert(categories.length >= 3, `At least 3 categories: ${categories.length}`);
            await t.assert(categories[0]!.text === "Inbox", "First category is Inbox");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless Selectors: selectStats counts correctly", async (t) => {
        const s = snapshot();
        try {
            // Switch to a category with known data
            d(SelectCategory({ id: "cat_inbox" }));

            // Add known items
            d(AddTodo({ text: "Active 1" }));
            d(AddTodo({ text: "Done 1" }));
            const doneId = selectVisibleTodos(appState()).find(t => t.text === "Done 1")!.id;
            d(ToggleTodo({ id: doneId }));

            const stats = selectStats(appState());
            await t.assert(stats.completed >= 1, `Completed count >= 1: ${stats.completed}`);
            await t.assert(stats.active >= 1, `Active count >= 1: ${stats.active}`);
            await t.assert(stats.total === stats.completed + stats.active, "total = completed + active");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless Selectors: selectEditingTodo returns editing item", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Edit Target" }));
            const id = selectVisibleTodos(appState()).find(t => t.text === "Edit Target")!.id;

            await t.assert(selectEditingTodo(appState()) === null, "No editing before StartEdit");

            d(StartEdit({ id }));
            const editing = selectEditingTodo(appState());
            await t.assert(editing !== null, "Editing todo returned");
            await t.assert(editing!.text === "Edit Target", "Correct todo returned");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless Selectors: selectTodosByCategory groups correctly", async (t) => {
        const s = snapshot();
        try {
            const grouped = selectTodosByCategory(appState());
            await t.assert(grouped instanceof Map, "Returns a Map");
            // Every category should have an entry
            const categories = selectCategories(appState());
            for (const cat of categories) {
                await t.assert(grouped.has(cat.id), `Category "${cat.text}" has entry`);
            }
        } finally {
            restore(s);
        }
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Ordering
    // ─────────────────────────────────────────────────────────────

    bot.describe("Headless Order: MoveItemUp swaps positions", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "First" }));
            d(AddTodo({ text: "Second" }));

            const todos = selectVisibleTodos(appState());
            const secondId = todos.find(t => t.text === "Second")!.id;

            d(MoveItemUp({ focusId: secondId }));

            const after = selectVisibleTodos(appState());
            const secondIdx = after.findIndex(t => t.text === "Second");
            const firstIdx = after.findIndex(t => t.text === "First");
            await t.assert(secondIdx < firstIdx, "Second moved above First");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless Order: MoveItemUp at top does nothing", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Top" }));
            d(AddTodo({ text: "Bottom" }));

            const topId = selectVisibleTodos(appState()).find(t => t.text === "Top")!.id;
            const beforeOrder = selectVisibleTodos(appState()).map(t => t.id);

            d(MoveItemUp({ focusId: topId }));

            const afterOrder = selectVisibleTodos(appState()).map(t => t.id);
            await t.assert(
                JSON.stringify(beforeOrder) === JSON.stringify(afterOrder),
                "Order unchanged at top"
            );
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless Order: MoveItemDown swaps positions", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "A" }));
            d(AddTodo({ text: "B" }));

            const aId = selectVisibleTodos(appState()).find(t => t.text === "A")!.id;

            d(MoveItemDown({ focusId: aId }));

            const after = selectVisibleTodos(appState());
            const aIdx = after.findIndex(t => t.text === "A");
            const bIdx = after.findIndex(t => t.text === "B");
            await t.assert(aIdx > bIdx, "A moved below B");
        } finally {
            restore(s);
        }
    });

    // ─────────────────────────────────────────────────────────────
    // 5. Category
    // ─────────────────────────────────────────────────────────────

    bot.describe("Headless Category: SelectCategory changes visible todos", async (t) => {
        const s = snapshot();
        try {
            d(SelectCategory({ id: "cat_work" }));
            await t.assert(appState().ui.selectedCategoryId === "cat_work", "Category changed to work");

            d(SelectCategory({ id: "cat_inbox" }));
            await t.assert(appState().ui.selectedCategoryId === "cat_inbox", "Category changed to inbox");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless Category: MoveCategoryUp/Down reorders", async (t) => {
        const s = snapshot();
        try {
            // Select second category (cat_work)
            d(SelectCategory({ id: "cat_work" }));
            const beforeOrder = [...appState().data.categoryOrder];

            d(MoveCategoryUp());

            const afterOrder = [...appState().data.categoryOrder];
            const workIdxBefore = beforeOrder.indexOf("cat_work");
            const workIdxAfter = afterOrder.indexOf("cat_work");
            await t.assert(workIdxAfter < workIdxBefore, "Category moved up");

            d(MoveCategoryDown());
            const restored = [...appState().data.categoryOrder];
            await t.assert(
                JSON.stringify(restored) === JSON.stringify(beforeOrder),
                "Category restored after down"
            );
        } finally {
            restore(s);
        }
    });

    // ─────────────────────────────────────────────────────────────
    // 6. Clipboard (current impure - testing state effects only)
    // ─────────────────────────────────────────────────────────────

    bot.describe("Headless Clipboard: DuplicateTodo creates copy", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Original" }));
            const todos = selectVisibleTodos(appState());
            const originalId = todos.find(t => t.text === "Original")!.id;

            d(DuplicateTodo({ id: originalId }));

            const after = selectVisibleTodos(appState());
            const originals = after.filter(t => t.text === "Original");
            await t.assert(originals.length === 2, `Duplicate created: ${originals.length} copies`);
        } finally {
            restore(s);
        }
    });

    // ─────────────────────────────────────────────────────────────
    // 7. View
    // ─────────────────────────────────────────────────────────────

    bot.describe("Headless View: ToggleView switches list ↔ board", async (t) => {
        const s = snapshot();
        try {
            const initial = appState().ui.viewMode;
            d(ToggleView());
            const toggled = appState().ui.viewMode;
            await t.assert(toggled !== initial, `View changed: ${initial} → ${toggled}`);

            d(ToggleView());
            await t.assert(appState().ui.viewMode === initial, "Toggled back");
        } finally {
            restore(s);
        }
    });

    // ─────────────────────────────────────────────────────────────
    // 8. Undo / Redo
    // ─────────────────────────────────────────────────────────────

    bot.describe("Headless Undo: Reverse delete", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Undoable" }));
            const id = selectVisibleTodos(appState()).find(t => t.text === "Undoable")!.id;

            d(DeleteTodo({ id }));
            await t.assert(!selectVisibleTodos(appState()).some(t => t.text === "Undoable"), "Deleted");

            d(UndoCommand());
            await t.assert(selectVisibleTodos(appState()).some(t => t.text === "Undoable"), "Restored by undo");
        } finally {
            restore(s);
        }
    });

    bot.describe("Headless Redo: Re-apply after undo", async (t) => {
        const s = snapshot();
        try {
            d(AddTodo({ text: "Redo Target" }));
            const id = selectVisibleTodos(appState()).find(t => t.text === "Redo Target")!.id;

            d(DeleteTodo({ id }));
            d(UndoCommand());
            await t.assert(selectVisibleTodos(appState()).some(t => t.text === "Redo Target"), "Undone");

            d(RedoCommand());
            await t.assert(!selectVisibleTodos(appState()).some(t => t.text === "Redo Target"), "Redone");
        } finally {
            restore(s);
        }
    });

    // ─────────────────────────────────────────────────────────────
    // 9. Draft Sync
    // ─────────────────────────────────────────────────────────────

    bot.describe("Headless Draft: SyncDraft updates state", async (t) => {
        const s = snapshot();
        try {
            d(SyncDraft({ text: "Hello" }));
            await t.assert(appState().ui.draft === "Hello", "Draft updated");

            d(SyncDraft({ text: "" }));
            await t.assert(appState().ui.draft === "", "Draft cleared");
        } finally {
            restore(s);
        }
    });
}

// ═══════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════

export function useTodoHeadlessBotRoutes() {
    useTestBotRoutes("todo-headless", defineHeadlessTests);
}
