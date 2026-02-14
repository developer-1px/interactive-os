/**
 * Todo v3 unit tests — testing defineApp + createWidget pattern.
 *
 * Uses TodoApp.create() for isolated testing.
 * All widget commands are accessible through app.dispatch.
 */

import { TodoApp } from "@apps/todo/app-v3";
import { describe, expect, test, vi } from "vitest";

let now = 1000;

describe("defineApp + createWidget", () => {
  function createApp() {
    vi.spyOn(Date, "now").mockImplementation(() => ++now);
    return TodoApp.create();
  }

  describe("CRUD (from TodoDraft + TodoList widgets)", () => {
    test("addTodo creates item", () => {
      const app = createApp();
      const before = Object.keys(app.state.data.todos).length;
      app.dispatch.addTodo({ text: "Buy milk" });
      expect(Object.keys(app.state.data.todos).length).toBe(before + 1);
    });

    test("addTodo via draft", () => {
      const app = createApp();
      app.dispatch.syncDraft({ text: "From draft" });
      app.dispatch.addTodo({});
      const todos = Object.values(app.state.data.todos);
      expect(todos.some((t) => t.text === "From draft")).toBe(true);
    });

    test("addTodo with empty text → no-op", () => {
      const app = createApp();
      const before = Object.keys(app.state.data.todos).length;
      app.dispatch.addTodo({ text: "" });
      expect(Object.keys(app.state.data.todos).length).toBe(before);
    });

    test("deleteTodo removes item", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Delete me" });
      const before = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos).map(Number);
      const lastId = ids[ids.length - 1]!;
      app.dispatch.deleteTodo({ id: lastId });
      expect(Object.keys(app.state.data.todos).length).toBe(before - 1);
    });

    test("toggleTodo flips completed", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Toggle me" });
      const ids = Object.keys(app.state.data.todos).map(Number);
      const id = ids[ids.length - 1]!;
      expect(app.state.data.todos[id]!.completed).toBe(false);
      app.dispatch.toggleTodo({ id });
      expect(app.state.data.todos[id]!.completed).toBe(true);
    });

    test("clearCompleted removes only completed", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Keep" });
      app.dispatch.addTodo({ text: "Remove" });
      const ids = Object.keys(app.state.data.todos).map(Number);
      const lastId = ids[ids.length - 1]!;
      app.dispatch.toggleTodo({ id: lastId });
      const completedBefore = Object.values(app.state.data.todos).filter(
        (t) => t.completed,
      ).length;
      const activeBefore = Object.values(app.state.data.todos).filter(
        (t) => !t.completed,
      ).length;
      expect(completedBefore).toBeGreaterThan(0);
      app.dispatch.clearCompleted({});
      const remaining = Object.values(app.state.data.todos);
      expect(remaining.every((t) => !t.completed)).toBe(true);
      expect(remaining.length).toBe(activeBefore);
    });
  });

  describe("Editing (from TodoEdit widget)", () => {
    test("Start → SyncEditDraft → Save", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Original" });
      const ids = Object.keys(app.state.data.todos).map(Number);
      const id = ids[ids.length - 1]!;

      app.dispatch.startEdit({ id });
      expect(app.state.ui.editingId).toBe(id);
      expect(app.state.ui.editDraft).toBe("Original");

      app.dispatch.syncEditDraft({ text: "Updated" });
      expect(app.state.ui.editDraft).toBe("Updated");

      app.dispatch.updateTodoText({ text: "Updated" });
      expect(app.state.data.todos[id]!.text).toBe("Updated");
      expect(app.state.ui.editingId).toBeNull();
    });

    test("Cancel preserves original", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Original" });
      const ids = Object.keys(app.state.data.todos).map(Number);
      const id = ids[ids.length - 1]!;

      app.dispatch.startEdit({ id });
      app.dispatch.syncEditDraft({ text: "Changed" });
      app.dispatch.cancelEdit({});

      expect(app.state.data.todos[id]!.text).toBe("Original");
      expect(app.state.ui.editingId).toBeNull();
    });
  });

  describe("Selectors", () => {
    test("visibleTodos filters by category", () => {
      const app = createApp();
      const before = app.select.visibleTodos().length;
      app.dispatch.addTodo({ text: "In default" });
      expect(app.select.visibleTodos().length).toBe(before + 1);
    });

    test("categories preserves order", () => {
      const app = createApp();
      const cats = app.select.categories();
      expect(cats).toBeDefined();
      expect(Array.isArray(cats)).toBe(true);
    });

    test("stats counts correctly", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "One" });
      app.dispatch.addTodo({ text: "Two" });
      const statsBefore = app.select.stats();
      const ids = Object.keys(app.state.data.todos).map(Number);
      const lastId = ids[ids.length - 1]!;
      app.dispatch.toggleTodo({ id: lastId });
      const statsAfter = app.select.stats();
      expect(statsAfter.completed).toBe(statsBefore.completed + 1);
      expect(statsAfter.active).toBe(statsBefore.active - 1);
    });

    test("editingTodo returns editing item", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Edit me" });
      const ids = Object.keys(app.state.data.todos).map(Number);
      const id = ids[ids.length - 1]!;
      app.dispatch.startEdit({ id });
      const editing = app.select.editingTodo();
      expect(editing?.id).toBe(id);
    });
  });

  describe("Ordering (from TodoList widget)", () => {
    test("moveItemUp swaps positions", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "First" });
      app.dispatch.addTodo({ text: "Second" });
      const order = app.state.data.todoOrder;
      const lastIdx = order.length - 1;
      const secondLast = order[lastIdx]!;
      const thirdLast = order[lastIdx - 1]!;
      app.dispatch.moveItemUp({ id: secondLast });
      expect(app.state.data.todoOrder[lastIdx - 1]).toBe(secondLast);
      expect(app.state.data.todoOrder[lastIdx]).toBe(thirdLast);
    });

    test("moveItemDown swaps positions", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "First" });
      app.dispatch.addTodo({ text: "Second" });
      const order = app.state.data.todoOrder;
      const lastIdx = order.length - 1;
      const secondLast = order[lastIdx]!;
      const thirdLast = order[lastIdx - 1]!;
      app.dispatch.moveItemDown({ id: thirdLast });
      expect(app.state.data.todoOrder[lastIdx - 1]).toBe(secondLast);
      expect(app.state.data.todoOrder[lastIdx]).toBe(thirdLast);
    });

    test("moveItemUp at top is no-op", () => {
      const app = createApp();
      const topId = app.state.data.todoOrder[0]!;
      const beforeOrder = [...app.state.data.todoOrder];
      app.dispatch.moveItemUp({ id: topId });
      expect(app.state.data.todoOrder).toEqual(beforeOrder);
    });
  });

  describe("Draft (from TodoDraft widget)", () => {
    test("syncDraft updates draft text", () => {
      const app = createApp();
      app.dispatch.syncDraft({ text: "Hello" });
      expect(app.state.ui.draft).toBe("Hello");
      app.dispatch.syncDraft({ text: "" });
      expect(app.state.ui.draft).toBe("");
    });
  });

  describe("Category (from TodoSidebar widget)", () => {
    test("selectCategory changes selectedCategoryId", () => {
      const app = createApp();
      app.dispatch.selectCategory({ id: "cat_work" });
      expect(app.state.ui.selectedCategoryId).toBe("cat_work");
    });

    test("moveCategoryUp/Down reorders", () => {
      const app = createApp();
      app.dispatch.selectCategory({ id: "cat_work" });
      const beforeOrder = [...app.state.data.categoryOrder];
      const workIdxBefore = beforeOrder.indexOf("cat_work");

      app.dispatch.moveCategoryUp({});
      const afterOrder = [...app.state.data.categoryOrder];
      const workIdxAfter = afterOrder.indexOf("cat_work");
      expect(workIdxAfter).toBeLessThan(workIdxBefore);

      app.dispatch.moveCategoryDown({});
      const restored = [...app.state.data.categoryOrder];
      expect(restored).toEqual(beforeOrder);
    });
  });

  describe("Clipboard (from TodoList widget)", () => {
    test("duplicateTodo creates copy", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Original" });
      const before = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos).map(Number);
      const lastId = ids[ids.length - 1]!;
      app.dispatch.duplicateTodo({ id: lastId });
      expect(Object.keys(app.state.data.todos).length).toBe(before + 1);
    });

    test("copyTodo stores todo in state.ui.clipboard", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Copy me" });
      const ids = Object.keys(app.state.data.todos).map(Number);
      const lastId = ids[ids.length - 1]!;
      app.dispatch.copyTodo({ id: lastId });
      expect(app.state.ui.clipboard).not.toBeNull();
      expect(app.state.ui.clipboard!.todo.text).toBe("Copy me");
      expect(app.state.ui.clipboard!.isCut).toBe(false);
    });

    test("copyTodo → pasteTodo creates duplicate", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Round trip" });
      const before = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos).map(Number);
      const lastId = ids[ids.length - 1]!;
      app.dispatch.copyTodo({ id: lastId });
      app.dispatch.pasteTodo({});
      expect(Object.keys(app.state.data.todos).length).toBe(before + 1);
      const todos = Object.values(app.state.data.todos);
      expect(todos.filter((t) => t.text === "Round trip").length).toBe(2);
    });

    test("cutTodo removes original and stores in clipboard", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Cut me" });
      const before = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos).map(Number);
      const lastId = ids[ids.length - 1]!;
      app.dispatch.cutTodo({ id: lastId });
      expect(Object.keys(app.state.data.todos).length).toBe(before - 1);
      expect(app.state.ui.clipboard).not.toBeNull();
      expect(app.state.ui.clipboard!.todo.text).toBe("Cut me");
      expect(app.state.ui.clipboard!.isCut).toBe(true);
    });

    test("cutTodo → pasteTodo restores item", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Move me" });
      const before = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos).map(Number);
      const lastId = ids[ids.length - 1]!;
      app.dispatch.cutTodo({ id: lastId });
      expect(Object.keys(app.state.data.todos).length).toBe(before - 1);
      app.dispatch.pasteTodo({});
      expect(Object.keys(app.state.data.todos).length).toBe(before);
      const todos = Object.values(app.state.data.todos);
      expect(todos.some((t) => t.text === "Move me")).toBe(true);
    });

    test("pasteTodo without clipboard is no-op", () => {
      const app = createApp();
      const before = Object.keys(app.state.data.todos).length;
      app.dispatch.pasteTodo({});
      expect(Object.keys(app.state.data.todos).length).toBe(before);
    });
  });

  describe("View (from TodoToolbar widget)", () => {
    test("toggleView switches modes", () => {
      const app = createApp();
      expect(app.state.ui.viewMode).toBe("list");
      app.dispatch.toggleView({});
      expect(app.state.ui.viewMode).toBe("board");
      app.dispatch.toggleView({});
      expect(app.state.ui.viewMode).toBe("list");
    });
  });

  describe("Widget separation", () => {
    test("all widget commands accessible from single dispatch", () => {
      const app = createApp();

      // From TodoDraft widget
      expect(typeof app.dispatch.addTodo).toBe("function");
      expect(typeof app.dispatch.syncDraft).toBe("function");

      // From TodoList widget
      expect(typeof app.dispatch.toggleTodo).toBe("function");
      expect(typeof app.dispatch.deleteTodo).toBe("function");
      expect(typeof app.dispatch.copyTodo).toBe("function");

      // From TodoSidebar widget
      expect(typeof app.dispatch.selectCategory).toBe("function");

      // From TodoEdit widget
      expect(typeof app.dispatch.updateTodoText).toBe("function");
      expect(typeof app.dispatch.cancelEdit).toBe("function");

      // From TodoToolbar widget
      expect(typeof app.dispatch.toggleView).toBe("function");
      expect(typeof app.dispatch.clearCompleted).toBe("function");
    });

    test("reset restores initial state", () => {
      const app = createApp();
      const initialCount = Object.keys(app.state.data.todos).length;
      app.dispatch.addTodo({ text: "Test" });
      expect(Object.keys(app.state.data.todos).length).toBe(initialCount + 1);
      app.reset();
      expect(Object.keys(app.state.data.todos).length).toBe(initialCount);
    });
  });

  describe("Command when guard", () => {
    test("cancelEdit.when returns false when not editing", () => {
      const app = createApp();
      const cancelEdit = app.commands.cancelEdit;
      expect((cancelEdit as any).when).not.toBeNull();
      expect((cancelEdit as any).when(app.state)).toBe(false);
    });

    test("cancelEdit.when returns true when editing", () => {
      const app = createApp();
      app.dispatch.addTodo({ text: "Edit me" });
      const ids = Object.keys(app.state.data.todos).map(Number);
      app.dispatch.startEdit({ id: ids[ids.length - 1]! });
      const cancelEdit = app.commands.cancelEdit;
      expect((cancelEdit as any).when(app.state)).toBe(true);
    });

    test("toggleTodo.when is null (always executable)", () => {
      const app = createApp();
      const toggleTodo = app.commands.toggleTodo;
      expect((toggleTodo as any).when).toBeNull();
    });
  });
});
