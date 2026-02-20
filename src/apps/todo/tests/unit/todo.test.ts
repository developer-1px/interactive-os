/**
 * Todo v5 unit tests — native defineApp v5 API.
 *
 * Uses individual command exports + TodoApp.create() for isolated testing.
 * v5 style: app.dispatch(commandFactory(payload))
 */

import {
  addTodo,
  cancelEdit,
  canUndo,
  categories,
  clearCompleted,
  copyTodo,
  cutTodo,
  deleteTodo,
  duplicateTodo,
  editingTodo,
  hasClipboard,
  isEditing,
  moveCategoryDown,
  moveCategoryUp,
  moveItemDown,
  moveItemUp,
  pasteTodo,
  selectCategory,
  startEdit,
  stats,
  TodoApp,
  toggleTodo,
  toggleView,
  updateTodoText,
  visibleTodos,
} from "@apps/todo/app";
import { describe, expect, test, vi } from "vitest";
import {
  _resetClipboardStore,
  readClipboard,
} from "@/os/collection/createCollectionZone";

let now = 1000;

describe("Todo v5 — defineApp native", () => {
  function createApp() {
    vi.spyOn(Date, "now").mockImplementation(() => ++now);
    _resetClipboardStore();
    return TodoApp.create({ withOS: true });
  }

  /** Helper: read clipboard first item */
  function clipFirstItem(): any {
    return readClipboard();
  }

  // ─── CRUD ───

  describe("CRUD", () => {
    test("addTodo creates item", () => {
      const app = createApp();
      const before = Object.keys(app.state.data.todos).length;
      app.dispatch(addTodo({ text: "Buy milk" }));
      expect(Object.keys(app.state.data.todos).length).toBe(before + 1);
    });

    test("addTodo with empty text → no-op", () => {
      const app = createApp();
      const before = Object.keys(app.state.data.todos).length;
      app.dispatch(addTodo({ text: "" }));
      expect(Object.keys(app.state.data.todos).length).toBe(before);
    });

    test("deleteTodo removes item", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Delete me" }));
      const before = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos);
      const lastId = ids[ids.length - 1]!;
      app.dispatch(deleteTodo({ id: lastId }));
      expect(Object.keys(app.state.data.todos).length).toBe(before - 1);
    });

    test("toggleTodo flips completed", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Toggle me" }));
      const ids = Object.keys(app.state.data.todos);
      const id = ids[ids.length - 1]!;
      expect(app.state.data.todos[id]?.completed).toBe(false);
      app.dispatch(toggleTodo({ id }));
      expect(app.state.data.todos[id]?.completed).toBe(true);
    });

    test("clearCompleted removes only completed", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Keep" }));
      app.dispatch(addTodo({ text: "Remove" }));
      const ids = Object.keys(app.state.data.todos);
      const lastId = ids[ids.length - 1]!;
      app.dispatch(toggleTodo({ id: lastId }));
      const activeBefore = Object.values(app.state.data.todos).filter(
        (t) => !t.completed,
      ).length;
      app.dispatch(clearCompleted());
      const remaining = Object.values(app.state.data.todos);
      expect(remaining.every((t) => !t.completed)).toBe(true);
      expect(remaining.length).toBe(activeBefore);
    });
  });

  // ─── Editing ───

  describe("Editing", () => {
    test("Start → SyncEditDraft → Save", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Original" }));
      const ids = Object.keys(app.state.data.todos);
      const id = ids[ids.length - 1]!;

      app.dispatch(startEdit({ id }));
      expect(app.state.ui.editingId).toBe(id);

      // No syncEditDraft step anymore - Field manages state locally
      // app.dispatch(syncEditDraft({ text: "Updated" }));

      app.dispatch(updateTodoText({ text: "Updated" }));
      expect(app.state.data.todos[id]?.text).toBe("Updated");
      expect(app.state.ui.editingId).toBeNull();
    });

    test("Cancel preserves original", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Original" }));
      const ids = Object.keys(app.state.data.todos);
      const id = ids[ids.length - 1]!;

      app.dispatch(startEdit({ id }));
      // Field would have local state "Changed", but app state doesn't see it until commit
      // app.dispatch(syncEditDraft({ text: "Changed" }));
      app.dispatch(cancelEdit());

      expect(app.state.data.todos[id]?.text).toBe("Original");
      expect(app.state.ui.editingId).toBeNull();
    });
  });

  // ─── Selectors (branded) ───

  describe("Selectors", () => {
    test("visibleTodos filters by category", () => {
      const app = createApp();
      const before = app.select(visibleTodos).length;
      app.dispatch(addTodo({ text: "In default" }));
      expect(app.select(visibleTodos).length).toBe(before + 1);
    });

    test("categories preserves order", () => {
      const app = createApp();
      const cats = app.select(categories);
      expect(cats).toBeDefined();
      expect(Array.isArray(cats)).toBe(true);
    });

    test("stats counts correctly", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "One" }));
      app.dispatch(addTodo({ text: "Two" }));
      const statsBefore = app.select(stats);
      const ids = Object.keys(app.state.data.todos);
      const lastId = ids[ids.length - 1]!;
      app.dispatch(toggleTodo({ id: lastId }));
      const statsAfter = app.select(stats);
      expect(statsAfter.completed).toBe(statsBefore.completed + 1);
      expect(statsAfter.active).toBe(statsBefore.active - 1);
    });

    test("editingTodo returns editing item", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Edit me" }));
      const ids = Object.keys(app.state.data.todos);
      const id = ids[ids.length - 1]!;
      app.dispatch(startEdit({ id }));
      const editing = app.select(editingTodo);
      expect(editing?.id).toBe(id);
    });
  });

  // ─── Conditions (branded) ───

  describe("Conditions", () => {
    test("canUndo is false initially", () => {
      const app = createApp();
      expect(app.evaluate(canUndo)).toBe(false);
    });

    test("isEditing reflects editing state", () => {
      const app = createApp();
      expect(app.evaluate(isEditing)).toBe(false);
      app.dispatch(addTodo({ text: "Edit me" }));
      const ids = Object.keys(app.state.data.todos);
      app.dispatch(startEdit({ id: ids[ids.length - 1]! }));
      expect(app.evaluate(isEditing)).toBe(true);
    });

    test("hasClipboard is always true (OS-managed)", () => {
      const app = createApp();
      // hasClipboard is now always true since clipboard is OS-managed
      expect(app.evaluate(hasClipboard)).toBe(true);
    });
  });

  // ─── when guard ───

  describe("when guard", () => {
    test("cancelEdit blocked when not editing", () => {
      const app = createApp();
      const result = app.dispatch(cancelEdit());
      expect(result).toBe(false);
    });

    test("cancelEdit allowed when editing", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Edit me" }));
      const ids = Object.keys(app.state.data.todos);
      app.dispatch(startEdit({ id: ids[ids.length - 1]! }));
      const result = app.dispatch(cancelEdit());
      expect(result).toBe(true);
      expect(app.state.ui.editingId).toBeNull();
    });
  });

  // ─── Ordering ───

  describe("Ordering", () => {
    test("moveItemUp swaps positions", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "First" }));
      app.dispatch(addTodo({ text: "Second" }));
      const order = app.state.data.todoOrder;
      const lastIdx = order.length - 1;
      const secondLast = order[lastIdx]!;
      const thirdLast = order[lastIdx - 1]!;
      app.dispatch(moveItemUp({ id: secondLast }));
      expect(app.state.data.todoOrder[lastIdx - 1]).toBe(secondLast);
      expect(app.state.data.todoOrder[lastIdx]).toBe(thirdLast);
    });

    test("moveItemDown swaps positions", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "First" }));
      app.dispatch(addTodo({ text: "Second" }));
      const order = app.state.data.todoOrder;
      const lastIdx = order.length - 1;
      const secondLast = order[lastIdx]!;
      const thirdLast = order[lastIdx - 1]!;
      app.dispatch(moveItemDown({ id: thirdLast }));
      expect(app.state.data.todoOrder[lastIdx - 1]).toBe(secondLast);
      expect(app.state.data.todoOrder[lastIdx]).toBe(thirdLast);
    });

    test("moveItemUp at top is no-op", () => {
      const app = createApp();
      const topId = app.state.data.todoOrder[0]!;
      const beforeOrder = [...app.state.data.todoOrder];
      app.dispatch(moveItemUp({ id: topId }));
      expect(app.state.data.todoOrder).toEqual(beforeOrder);
    });
  });

  // ─── Category ───

  describe("Category", () => {
    test("selectCategory changes selectedCategoryId", () => {
      const app = createApp();
      app.dispatch(selectCategory({ id: "cat_work" }));
      expect(app.state.ui.selectedCategoryId).toBe("cat_work");
    });

    test("moveCategoryUp/Down reorders", () => {
      const app = createApp();
      app.dispatch(selectCategory({ id: "cat_work" }));
      const beforeOrder = [...app.state.data.categoryOrder];
      const workIdxBefore = beforeOrder.indexOf("cat_work");

      app.dispatch(moveCategoryUp());
      const afterOrder = [...app.state.data.categoryOrder];
      const workIdxAfter = afterOrder.indexOf("cat_work");
      expect(workIdxAfter).toBeLessThan(workIdxBefore);

      app.dispatch(moveCategoryDown());
      const restored = [...app.state.data.categoryOrder];
      expect(restored).toEqual(beforeOrder);
    });
  });

  // ─── Clipboard ───

  describe("Clipboard", () => {
    test("duplicateTodo creates copy", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Original" }));
      const before = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos);
      const lastId = ids[ids.length - 1]!;
      app.dispatch(duplicateTodo({ id: lastId }));
      expect(Object.keys(app.state.data.todos).length).toBe(before + 1);
    });

    test("copyTodo single item", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Copy me" }));
      const ids = Object.keys(app.state.data.todos);
      const lastId = ids[ids.length - 1]!;
      app.dispatch(copyTodo({ ids: [lastId] }));
      const first = clipFirstItem();
      expect(first).toBeDefined();
      expect(first?.text).toBe("Copy me");
    });

    test("copyTodo → pasteTodo creates duplicate", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Round trip" }));
      const before = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos);
      const lastId = ids[ids.length - 1]!;
      app.dispatch(copyTodo({ ids: [lastId] }));
      app.dispatch(pasteTodo({}));
      expect(Object.keys(app.state.data.todos).length).toBe(before + 1);
      const todos = Object.values(app.state.data.todos);
      expect(todos.filter((t) => t.text === "Round trip").length).toBe(2);
    });

    test("cutTodo removes original and stores in clipboard", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Cut me" }));
      const before = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos);
      const lastId = ids[ids.length - 1]!;
      app.dispatch(cutTodo({ ids: [lastId] }));
      expect(Object.keys(app.state.data.todos).length).toBe(before - 1);
      const first = clipFirstItem();
      expect(first).toBeDefined();
      expect(first?.text).toBe("Cut me");
    });

    test("cutTodo → pasteTodo restores item", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "Move me" }));
      const before = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos);
      const lastId = ids[ids.length - 1]!;
      app.dispatch(cutTodo({ ids: [lastId] }));
      expect(Object.keys(app.state.data.todos).length).toBe(before - 1);
      app.dispatch(pasteTodo({}));
      expect(Object.keys(app.state.data.todos).length).toBe(before);
      const todos = Object.values(app.state.data.todos);
      expect(todos.some((t) => t.text === "Move me")).toBe(true);
    });

    test("pasteTodo without clipboard is no-op", () => {
      const app = createApp();
      const before = Object.keys(app.state.data.todos).length;
      app.dispatch(pasteTodo({}));
      expect(Object.keys(app.state.data.todos).length).toBe(before);
    });

    // ── Multi-item clipboard (PRD Scenario 4: 벌크 작업) ──

    test("single copy overwrites previous clipboard", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "First" }));
      app.dispatch(addTodo({ text: "Second" }));
      const ids = Object.keys(app.state.data.todos);

      app.dispatch(copyTodo({ ids: [ids[ids.length - 2]!] }));
      let first = clipFirstItem();
      expect(first?.text).toBe("First");

      app.dispatch(copyTodo({ ids: [ids[ids.length - 1]!] }));
      first = clipFirstItem();
      expect(first?.text).toBe("Second");
    });

    // ── Batch clipboard: {ids} API ──

    test("copyTodo batch: 3 items at once", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "A" }));
      app.dispatch(addTodo({ text: "B" }));
      app.dispatch(addTodo({ text: "C" }));
      const ids = Object.keys(app.state.data.todos);
      const lastThree = ids.slice(-3);

      app.dispatch(copyTodo({ ids: lastThree }));

      const first = clipFirstItem();
      expect(first).toBeDefined();
      // readClipboard returns first item
      expect(first?.text).toBe("A");
    });

    test("copyTodo batch → paste: all 3 pasted", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "A" }));
      app.dispatch(addTodo({ text: "B" }));
      app.dispatch(addTodo({ text: "C" }));
      const ids = Object.keys(app.state.data.todos);
      const lastThree = ids.slice(-3);
      const beforeCount = Object.keys(app.state.data.todos).length;

      app.dispatch(copyTodo({ ids: lastThree }));
      app.dispatch(pasteTodo({}));

      expect(Object.keys(app.state.data.todos).length).toBe(beforeCount + 3);
      const todos = Object.values(app.state.data.todos);
      expect(todos.filter((t) => t.text === "A").length).toBe(2);
      expect(todos.filter((t) => t.text === "B").length).toBe(2);
      expect(todos.filter((t) => t.text === "C").length).toBe(2);
    });

    test("cutTodo batch: 3 items removed, all in clipboard", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "X" }));
      app.dispatch(addTodo({ text: "Y" }));
      app.dispatch(addTodo({ text: "Z" }));
      const ids = Object.keys(app.state.data.todos);
      const lastThree = ids.slice(-3);
      const beforeCount = Object.keys(app.state.data.todos).length;

      app.dispatch(cutTodo({ ids: lastThree }));

      expect(Object.keys(app.state.data.todos).length).toBe(beforeCount - 3);
      const first = clipFirstItem();
      expect(first).toBeDefined();
    });

    test("cutTodo batch → paste: all 3 restored", () => {
      const app = createApp();
      app.dispatch(addTodo({ text: "X" }));
      app.dispatch(addTodo({ text: "Y" }));
      app.dispatch(addTodo({ text: "Z" }));
      const ids = Object.keys(app.state.data.todos);
      const lastThree = ids.slice(-3);
      const beforeCount = Object.keys(app.state.data.todos).length;

      app.dispatch(cutTodo({ ids: lastThree }));
      expect(Object.keys(app.state.data.todos).length).toBe(beforeCount - 3);

      app.dispatch(pasteTodo({}));
      expect(Object.keys(app.state.data.todos).length).toBe(beforeCount);
      const todos = Object.values(app.state.data.todos);
      expect(todos.filter((t) => t.text === "X").length).toBe(1);
      expect(todos.filter((t) => t.text === "Y").length).toBe(1);
      expect(todos.filter((t) => t.text === "Z").length).toBe(1);
    });

    test("copyTodo with empty ids is no-op", () => {
      const app = createApp();
      app.dispatch(copyTodo({ ids: [] }));
      const first = clipFirstItem();
      expect(first).toBeNull();
    });
  });

  // ─── View ───

  describe("View", () => {
    test("toggleView switches modes", () => {
      const app = createApp();
      expect(app.state.ui.viewMode).toBe("list");
      app.dispatch(toggleView());
      expect(app.state.ui.viewMode).toBe("board");
      app.dispatch(toggleView());
      expect(app.state.ui.viewMode).toBe("list");
    });
  });

  // ─── Reset ───

  describe("Reset", () => {
    test("reset restores initial state", () => {
      const app = createApp();
      const initialCount = Object.keys(app.state.data.todos).length;
      app.dispatch(addTodo({ text: "Test" }));
      expect(Object.keys(app.state.data.todos).length).toBe(initialCount + 1);
      app.reset();
      expect(Object.keys(app.state.data.todos).length).toBe(initialCount);
    });
  });
});
