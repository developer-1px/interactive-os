/**
 * Todo createModule Tests — Vitest
 *
 * Demonstrates the createModule pattern:
 *   1 import. No kernel save/restore. No manual dispatch helper.
 *   TodoModule.create() → isolated instance → dispatch → assert.
 */

import { describe, test, expect, vi } from "vitest";
import { TodoModule } from "@apps/todo/module";

// ═══════════════════════════════════════════════════════════════════
// 1. CRUD
// ═══════════════════════════════════════════════════════════════════

describe("CRUD", () => {
    test("addTodo creates item", () => {
        const app = TodoModule.create();
        const before = app.select.visibleTodos().length;
        app.dispatch.addTodo({ text: "Buy milk" });

        const todos = app.select.visibleTodos();
        expect(todos.length).toBe(before + 1);
        expect(todos.some((t) => t.text === "Buy milk")).toBe(true);
    });

    test("addTodo via draft", () => {
        const app = TodoModule.create();
        app.dispatch.syncDraft({ text: "From draft" });
        app.dispatch.addTodo({});

        const todos = app.select.visibleTodos();
        expect(todos.some((t) => t.text === "From draft")).toBe(true);
        expect(app.state.ui.draft).toBe("");
    });

    test("addTodo with empty text → no-op", () => {
        const app = TodoModule.create();
        const before = app.select.visibleTodos().length;

        app.dispatch.syncDraft({ text: "" });
        app.dispatch.addTodo({});

        expect(app.select.visibleTodos().length).toBe(before);
    });

    test("deleteTodo removes item", () => {
        const app = TodoModule.create();
        vi.spyOn(Date, "now").mockReturnValue(42);
        app.dispatch.addTodo({ text: "Delete me" });

        app.dispatch.deleteTodo({ id: 42 });

        expect(app.select.visibleTodos().some((t) => t.text === "Delete me")).toBe(false);
        vi.restoreAllMocks();
    });

    test("toggleTodo flips completed", () => {
        const app = TodoModule.create();
        vi.spyOn(Date, "now").mockReturnValue(99);
        app.dispatch.addTodo({ text: "Toggle me" });

        app.dispatch.toggleTodo({ id: 99 });
        expect(app.state.data.todos[99]!.completed).toBe(true);

        app.dispatch.toggleTodo({ id: 99 });
        expect(app.state.data.todos[99]!.completed).toBe(false);
        vi.restoreAllMocks();
    });

    test("clearCompleted removes only completed", () => {
        const app = TodoModule.create();
        let id = 100;
        vi.spyOn(Date, "now").mockImplementation(() => ++id);

        app.dispatch.addTodo({ text: "Keep" });
        app.dispatch.addTodo({ text: "Clear" });
        const clearId = 102;
        app.dispatch.toggleTodo({ id: clearId });

        app.dispatch.clearCompleted();

        expect(app.state.data.todos[101]).toBeDefined();
        expect(app.state.data.todos[clearId]).toBeUndefined();
        vi.restoreAllMocks();
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Editing
// ═══════════════════════════════════════════════════════════════════

describe("Editing", () => {
    test("Start → SyncEditDraft → Save", () => {
        const app = TodoModule.create();
        vi.spyOn(Date, "now").mockReturnValue(200);
        app.dispatch.addTodo({ text: "Original" });

        app.dispatch.startEdit({ id: 200 });
        expect(app.state.ui.editingId).toBe(200);
        expect(app.state.ui.editDraft).toBe("Original");

        app.dispatch.syncEditDraft({ text: "Modified" });
        expect(app.state.ui.editDraft).toBe("Modified");

        app.dispatch.updateTodoText({ text: "Modified" });
        expect(app.state.data.todos[200]!.text).toBe("Modified");
        expect(app.state.ui.editingId).toBeNull();
        vi.restoreAllMocks();
    });

    test("Cancel preserves original", () => {
        const app = TodoModule.create();
        vi.spyOn(Date, "now").mockReturnValue(300);
        app.dispatch.addTodo({ text: "Keep Me" });

        app.dispatch.startEdit({ id: 300 });
        app.dispatch.syncEditDraft({ text: "Changed" });
        app.dispatch.cancelEdit();

        expect(app.state.data.todos[300]!.text).toBe("Keep Me");
        expect(app.state.ui.editingId).toBeNull();
        vi.restoreAllMocks();
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Selectors
// ═══════════════════════════════════════════════════════════════════

describe("Selectors", () => {
    test("visibleTodos filters by category", () => {
        const app = TodoModule.create();
        app.dispatch.selectCategory({ id: "cat_work" });
        const workTodos = app.select.visibleTodos();
        expect(workTodos.every((t) => t.categoryId === "cat_work")).toBe(true);

        app.dispatch.selectCategory({ id: "cat_inbox" });
        const inboxTodos = app.select.visibleTodos();
        expect(inboxTodos.every((t) => t.categoryId === "cat_inbox")).toBe(true);
    });

    test("categories preserves order", () => {
        const app = TodoModule.create();
        const categories = app.select.categories();
        expect(categories.length).toBeGreaterThanOrEqual(3);
        expect(categories[0]!.text).toBe("Inbox");
    });

    test("stats counts correctly", () => {
        const app = TodoModule.create();
        let id = 400;
        vi.spyOn(Date, "now").mockImplementation(() => ++id);

        app.dispatch.selectCategory({ id: "cat_inbox" });
        app.dispatch.addTodo({ text: "Active 1" });
        app.dispatch.addTodo({ text: "Done 1" });
        app.dispatch.toggleTodo({ id: 402 });

        const stats = app.select.stats();
        expect(stats.completed).toBeGreaterThanOrEqual(1);
        expect(stats.active).toBeGreaterThanOrEqual(1);
        expect(stats.total).toBe(stats.completed + stats.active);
        vi.restoreAllMocks();
    });

    test("editingTodo returns editing item", () => {
        const app = TodoModule.create();
        vi.spyOn(Date, "now").mockReturnValue(500);
        app.dispatch.addTodo({ text: "Edit Target" });

        expect(app.select.editingTodo()).toBeNull();

        app.dispatch.startEdit({ id: 500 });
        const editing = app.select.editingTodo();
        expect(editing).not.toBeNull();
        expect(editing!.text).toBe("Edit Target");
        vi.restoreAllMocks();
    });
});

// ═══════════════════════════════════════════════════════════════════
// 4. Ordering
// ═══════════════════════════════════════════════════════════════════

describe("Ordering", () => {
    test("moveItemUp swaps positions", () => {
        const app = TodoModule.create();
        let id = 600;
        vi.spyOn(Date, "now").mockImplementation(() => ++id);

        app.dispatch.addTodo({ text: "MU_First" });
        app.dispatch.addTodo({ text: "MU_Second" });

        const beforeTodos = app.select.visibleTodos();
        const firstId = beforeTodos.find((t) => t.text === "MU_First")!.id;
        const secondId = beforeTodos.find((t) => t.text === "MU_Second")!.id;
        const beforeIds = beforeTodos.map((t) => t.id);
        expect(beforeIds.indexOf(secondId)).toBeGreaterThan(beforeIds.indexOf(firstId));

        app.dispatch.moveItemUp({ focusId: secondId });

        const afterIds = app.select.visibleTodos().map((t) => t.id);
        expect(afterIds.indexOf(secondId)).toBeLessThan(afterIds.indexOf(firstId));
        vi.restoreAllMocks();
    });

    test("moveItemDown swaps positions", () => {
        const app = TodoModule.create();
        let id = 700;
        vi.spyOn(Date, "now").mockImplementation(() => ++id);

        app.dispatch.addTodo({ text: "A" });
        app.dispatch.addTodo({ text: "B" });

        app.dispatch.moveItemDown({ focusId: 701 });

        const afterIds = app.select.visibleTodos().map((t) => t.id);
        expect(afterIds.indexOf(701)).toBeGreaterThan(afterIds.indexOf(702));
        vi.restoreAllMocks();
    });
});

// ═══════════════════════════════════════════════════════════════════
// 5. Category
// ═══════════════════════════════════════════════════════════════════

describe("Category", () => {
    test("selectCategory changes selectedCategoryId", () => {
        const app = TodoModule.create();
        app.dispatch.selectCategory({ id: "cat_work" });
        expect(app.state.ui.selectedCategoryId).toBe("cat_work");

        app.dispatch.selectCategory({ id: "cat_inbox" });
        expect(app.state.ui.selectedCategoryId).toBe("cat_inbox");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 6. Clipboard
// ═══════════════════════════════════════════════════════════════════

describe("Clipboard", () => {
    test("duplicateTodo creates copy", () => {
        const app = TodoModule.create();
        vi.spyOn(Date, "now").mockReturnValueOnce(800).mockReturnValueOnce(801);
        app.dispatch.addTodo({ text: "Original" });
        app.dispatch.duplicateTodo({ id: 800 });

        const copies = app.select.visibleTodos().filter((t) => t.text === "Original");
        expect(copies.length).toBe(2);
        vi.restoreAllMocks();
    });
});

// ═══════════════════════════════════════════════════════════════════
// 7. View
// ═══════════════════════════════════════════════════════════════════

describe("View", () => {
    test("toggleView switches list ↔ board", () => {
        const app = TodoModule.create();
        const initial = app.state.ui.viewMode;
        app.dispatch.toggleView();
        expect(app.state.ui.viewMode).not.toBe(initial);

        app.dispatch.toggleView();
        expect(app.state.ui.viewMode).toBe(initial);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 8. Reset & Isolation
// ═══════════════════════════════════════════════════════════════════

describe("Module Instance", () => {
    test("create() returns isolated instance", () => {
        const app1 = TodoModule.create();
        const app2 = TodoModule.create();

        app1.dispatch.addTodo({ text: "Only in app1" });

        expect(app1.select.visibleTodos().length).toBeGreaterThan(0);
        // app2 should not have app1's todo
        const app2Todos = app2.select.visibleTodos();
        expect(app2Todos.some((t) => t.text === "Only in app1")).toBe(false);
    });

    test("reset() returns to initial state", () => {
        const app = TodoModule.create();
        app.dispatch.addTodo({ text: "Will be gone" });
        expect(app.select.visibleTodos().some((t) => t.text === "Will be gone")).toBe(true);

        app.reset();

        expect(app.select.visibleTodos().some((t) => t.text === "Will be gone")).toBe(false);
    });

    test("create(overrides) starts with custom state", () => {
        const app = TodoModule.create({
            ui: {
                selectedCategoryId: "cat_work",
                draft: "",
                editingId: null,
                editDraft: "",
                viewMode: "board",
                isInspectorOpen: false,
            },
        } as any);

        expect(app.state.ui.viewMode).toBe("board");
    });
});

// ═══════════════════════════════════════════════════════════════════
// 9. Draft
// ═══════════════════════════════════════════════════════════════════

describe("Draft", () => {
    test("syncDraft updates state", () => {
        const app = TodoModule.create();
        app.dispatch.syncDraft({ text: "Hello" });
        expect(app.state.ui.draft).toBe("Hello");

        app.dispatch.syncDraft({ text: "" });
        expect(app.state.ui.draft).toBe("");
    });
});
