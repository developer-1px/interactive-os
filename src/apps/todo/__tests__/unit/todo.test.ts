/**
 * Todo — App Logic Tests via createPage (latest pattern)
 *
 * Uses createPage(TodoApp) + page.dispatch() for app-level command testing.
 * OS pipeline is active — commands go through kernel dispatch.
 */

import {
  addTodo,
  cancelDeleteTodo,
  cancelEdit,
  canUndo,
  categories,
  clearCompleted,
  confirmDeleteTodo,
  copyTodo,
  cutTodo,
  deleteTodo,
  duplicateTodo,
  editingTodo,
  hasClipboard,
  isEditing,
  moveItemDown,
  moveItemUp,
  pasteTodo,
  requestDeleteTodo,
  selectCategory,
  startEdit,
  stats,
  TodoApp,
  TodoSidebar,
  toggleTodo,
  toggleView,
  updateTodoText,
  visibleTodos,
} from "@apps/todo/app";
import type { AppState } from "@apps/todo/model/appState";
import { type AppPage, createPage } from "@os-devtool/testing/page";
import {
  _resetClipboardStore,
  readClipboard,
} from "@os-sdk/library/collection/createCollectionZone";
import { beforeEach, describe, expect, test } from "vitest";

describe("Todo — App Logic via createPage", () => {
  let page: AppPage<AppState>;

  beforeEach(() => {
    _resetClipboardStore();
    page = createPage(TodoApp);
  });

  // ─── CRUD ───

  describe("CRUD", () => {
    test("addTodo creates item", () => {
      const before = Object.keys(page.state.data.todos).length;
      page.dispatch(addTodo({ text: "Buy milk" }));
      expect(Object.keys(page.state.data.todos).length).toBe(before + 1);
    });

    test("addTodo with empty text is no-op", () => {
      const before = Object.keys(page.state.data.todos).length;
      page.dispatch(addTodo({ text: "" }));
      expect(Object.keys(page.state.data.todos).length).toBe(before);
    });

    test("deleteTodo removes item", () => {
      page.dispatch(addTodo({ text: "Delete me" }));
      const before = Object.keys(page.state.data.todos).length;
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(deleteTodo({ id: lastId }));
      expect(Object.keys(page.state.data.todos).length).toBe(before - 1);
    });

    test("requestDeleteTodo sets pending IDs", () => {
      page.dispatch(addTodo({ text: "Pending delete" }));
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(requestDeleteTodo({ ids: [lastId] }));
      expect(page.state.ui.pendingDeleteIds).toEqual([lastId]);
    });

    test("confirmDeleteTodo removes pending items", () => {
      page.dispatch(addTodo({ text: "Confirm delete" }));
      const before = Object.keys(page.state.data.todos).length;
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(requestDeleteTodo({ ids: [lastId] }));
      page.dispatch(confirmDeleteTodo());
      expect(page.state.ui.pendingDeleteIds).toEqual([]);
      expect(Object.keys(page.state.data.todos).length).toBe(before - 1);
    });

    test("cancelDeleteTodo clears pending without deleting", () => {
      page.dispatch(addTodo({ text: "Cancel delete" }));
      const before = Object.keys(page.state.data.todos).length;
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(requestDeleteTodo({ ids: [lastId] }));
      page.dispatch(cancelDeleteTodo());
      expect(page.state.ui.pendingDeleteIds).toEqual([]);
      expect(Object.keys(page.state.data.todos).length).toBe(before);
    });

    test("toggleTodo flips completed", () => {
      page.dispatch(addTodo({ text: "Toggle me" }));
      const id =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      expect(page.state.data.todos[id]?.completed).toBe(false);
      page.dispatch(toggleTodo({ id }));
      expect(page.state.data.todos[id]?.completed).toBe(true);
    });

    test("clearCompleted removes only completed", () => {
      page.dispatch(addTodo({ text: "Keep" }));
      page.dispatch(addTodo({ text: "Remove" }));
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(toggleTodo({ id: lastId }));
      const activeBefore = Object.values(page.state.data.todos).filter(
        (t) => !t.completed,
      ).length;
      page.dispatch(clearCompleted());
      const remaining = Object.values(page.state.data.todos);
      expect(remaining.every((t) => !t.completed)).toBe(true);
      expect(remaining.length).toBe(activeBefore);
    });
  });

  // ─── Editing ───

  describe("Editing", () => {
    test("startEdit + updateTodoText saves", () => {
      page.dispatch(addTodo({ text: "Original" }));
      const id =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(startEdit({ id }));
      expect(page.state.ui.editingId).toBe(id);
      page.dispatch(updateTodoText({ text: "Updated" }));
      expect(page.state.data.todos[id]?.text).toBe("Updated");
      expect(page.state.ui.editingId).toBeNull();
    });

    test("cancelEdit preserves original", () => {
      page.dispatch(addTodo({ text: "Original" }));
      const id =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(startEdit({ id }));
      page.dispatch(cancelEdit());
      expect(page.state.data.todos[id]?.text).toBe("Original");
      expect(page.state.ui.editingId).toBeNull();
    });
  });

  // ─── Selectors ───

  describe("Selectors", () => {
    test("visibleTodos filters by category", () => {
      const before = visibleTodos.select(page.state).length;
      page.dispatch(addTodo({ text: "In default" }));
      expect(visibleTodos.select(page.state).length).toBe(before + 1);
    });

    test("categories returns array", () => {
      const cats = categories.select(page.state);
      expect(Array.isArray(cats)).toBe(true);
    });

    test("stats counts correctly", () => {
      page.dispatch(addTodo({ text: "One" }));
      page.dispatch(addTodo({ text: "Two" }));
      const statsBefore = stats.select(page.state);
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(toggleTodo({ id: lastId }));
      const statsAfter = stats.select(page.state);
      expect(statsAfter.completed).toBe(statsBefore.completed + 1);
      expect(statsAfter.active).toBe(statsBefore.active - 1);
    });

    test("editingTodo returns editing item", () => {
      page.dispatch(addTodo({ text: "Edit me" }));
      const id =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(startEdit({ id }));
      const editing = editingTodo.select(page.state);
      expect(editing?.id).toBe(id);
    });
  });

  // ─── Conditions ───

  describe("Conditions", () => {
    test("canUndo is false initially", () => {
      expect(canUndo.evaluate(page.state)).toBe(false);
    });

    test("isEditing reflects editing state", () => {
      expect(isEditing.evaluate(page.state)).toBe(false);
      page.dispatch(addTodo({ text: "Edit me" }));
      const id =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(startEdit({ id }));
      expect(isEditing.evaluate(page.state)).toBe(true);
    });

    test("hasClipboard is always true", () => {
      expect(hasClipboard.evaluate(page.state)).toBe(true);
    });
  });

  // ─── when guard ───

  describe("when guard", () => {
    test("cancelEdit blocked when not editing", () => {
      const before = page.state.ui.editingId;
      page.dispatch(cancelEdit());
      // State unchanged — when guard blocked execution
      expect(page.state.ui.editingId).toBe(before);
    });

    test("cancelEdit allowed when editing", () => {
      page.dispatch(addTodo({ text: "Edit me" }));
      const id =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(startEdit({ id }));
      expect(page.state.ui.editingId).toBe(id);
      page.dispatch(cancelEdit());
      expect(page.state.ui.editingId).toBeNull();
    });
  });

  // ─── Ordering ───

  describe("Ordering", () => {
    test("moveItemUp swaps positions", () => {
      page.dispatch(addTodo({ text: "First" }));
      page.dispatch(addTodo({ text: "Second" }));
      const order = page.state.data.todoOrder;
      const lastIdx = order.length - 1;
      const last = order[lastIdx]!;
      const prev = order[lastIdx - 1]!;
      page.dispatch(moveItemUp({ id: last }));
      expect(page.state.data.todoOrder[lastIdx - 1]).toBe(last);
      expect(page.state.data.todoOrder[lastIdx]).toBe(prev);
    });

    test("moveItemDown swaps positions", () => {
      page.dispatch(addTodo({ text: "First" }));
      page.dispatch(addTodo({ text: "Second" }));
      const order = page.state.data.todoOrder;
      const lastIdx = order.length - 1;
      const prev = order[lastIdx - 1]!;
      page.dispatch(moveItemDown({ id: prev }));
      expect(page.state.data.todoOrder[lastIdx]).toBe(prev);
    });

    test("moveItemUp at top is no-op", () => {
      const topId = page.state.data.todoOrder[0]!;
      const beforeOrder = [...page.state.data.todoOrder];
      page.dispatch(moveItemUp({ id: topId }));
      expect(page.state.data.todoOrder).toEqual(beforeOrder);
    });
  });

  // ─── Category ───

  describe("Category", () => {
    test("selectCategory changes selectedCategoryId", () => {
      page.dispatch(selectCategory({ id: "cat_work" }));
      expect(page.state.ui.selectedCategoryId).toBe("cat_work");
    });

    test("moveCategoryUp/Down reorders", () => {
      const beforeOrder = [...page.state.data.categoryOrder];
      const workIdxBefore = beforeOrder.indexOf("cat_work");

      page.dispatch(TodoSidebar.commands.moveCategoryUp({ id: "cat_work" }));
      const workIdxAfter = page.state.data.categoryOrder.indexOf("cat_work");
      expect(workIdxAfter).toBeLessThan(workIdxBefore);

      page.dispatch(TodoSidebar.commands.moveCategoryDown({ id: "cat_work" }));
      expect(page.state.data.categoryOrder).toEqual(beforeOrder);
    });
  });

  // ─── Clipboard ───

  describe("Clipboard", () => {
    test("duplicateTodo creates copy", () => {
      page.dispatch(addTodo({ text: "Original" }));
      const before = Object.keys(page.state.data.todos).length;
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(duplicateTodo({ id: lastId }));
      expect(Object.keys(page.state.data.todos).length).toBe(before + 1);
    });

    test("copyTodo single item", () => {
      page.dispatch(addTodo({ text: "Copy me" }));
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(copyTodo({ ids: [lastId] }));
      const first = readClipboard();
      expect(first).toBeDefined();
      expect(first?.text).toBe("Copy me");
    });

    test("copyTodo + pasteTodo creates duplicate", () => {
      page.dispatch(addTodo({ text: "Round trip" }));
      const before = Object.keys(page.state.data.todos).length;
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(copyTodo({ ids: [lastId] }));
      page.dispatch(pasteTodo({}));
      expect(Object.keys(page.state.data.todos).length).toBe(before + 1);
    });

    test("cutTodo removes original", () => {
      page.dispatch(addTodo({ text: "Cut me" }));
      const before = Object.keys(page.state.data.todos).length;
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(cutTodo({ ids: [lastId] }));
      expect(Object.keys(page.state.data.todos).length).toBe(before - 1);
      expect(readClipboard()?.text).toBe("Cut me");
    });

    test("cutTodo + pasteTodo restores item", () => {
      page.dispatch(addTodo({ text: "Move me" }));
      const before = Object.keys(page.state.data.todos).length;
      const lastId =
        page.state.data.todoOrder[page.state.data.todoOrder.length - 1]!;
      page.dispatch(cutTodo({ ids: [lastId] }));
      page.dispatch(pasteTodo({}));
      expect(Object.keys(page.state.data.todos).length).toBe(before);
    });

    test("pasteTodo without clipboard is no-op", () => {
      const before = Object.keys(page.state.data.todos).length;
      page.dispatch(pasteTodo({}));
      expect(Object.keys(page.state.data.todos).length).toBe(before);
    });

    test("copyTodo batch + paste: all pasted", () => {
      page.dispatch(addTodo({ text: "A" }));
      page.dispatch(addTodo({ text: "B" }));
      page.dispatch(addTodo({ text: "C" }));
      const order = page.state.data.todoOrder;
      const lastThree = order.slice(-3);
      const before = Object.keys(page.state.data.todos).length;
      page.dispatch(copyTodo({ ids: lastThree }));
      page.dispatch(pasteTodo({}));
      expect(Object.keys(page.state.data.todos).length).toBe(before + 3);
    });

    test("cutTodo batch + paste: all restored", () => {
      page.dispatch(addTodo({ text: "X" }));
      page.dispatch(addTodo({ text: "Y" }));
      page.dispatch(addTodo({ text: "Z" }));
      const order = page.state.data.todoOrder;
      const lastThree = order.slice(-3);
      const before = Object.keys(page.state.data.todos).length;
      page.dispatch(cutTodo({ ids: lastThree }));
      expect(Object.keys(page.state.data.todos).length).toBe(before - 3);
      page.dispatch(pasteTodo({}));
      expect(Object.keys(page.state.data.todos).length).toBe(before);
    });

    test("copyTodo with empty ids is no-op", () => {
      page.dispatch(copyTodo({ ids: [] }));
      expect(readClipboard()).toBeNull();
    });
  });

  // ─── View ───

  describe("View", () => {
    test("toggleView switches modes", () => {
      expect(page.state.ui.viewMode).toBe("list");
      page.dispatch(toggleView());
      expect(page.state.ui.viewMode).toBe("board");
      page.dispatch(toggleView());
      expect(page.state.ui.viewMode).toBe("list");
    });
  });
});
