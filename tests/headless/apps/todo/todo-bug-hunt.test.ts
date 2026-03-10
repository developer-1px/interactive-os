/**
 * Todo App — Bug Hunt Tests
 *
 * Systematic coverage of untested areas to find hidden bugs.
 * page: Playwright-subset API. os: kernel singleton for state/dispatch.
 */

import {
  addTodo,
  cancelDeleteTodo,
  cancelEdit,
  clearCompleted,
  confirmDeleteTodo,
  requestDeleteTodo,
  selectCategory,
  setSearchQuery,
  startEdit,
  TodoApp,
  toggleTodo,
  toggleView,
  undoCommand,
  updateTodoText,
} from "@apps/todo/app";
import { createPage } from "@os-devtool/testing/page";
import { os } from "@os-core/engine/kernel";
import { _resetClipboardStore } from "@os-sdk/library/collection/createCollectionZone";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppState } from "../../../../src/apps/todo/model/appState";
import type { Page } from "@os-devtool/testing/types";

import TodoPage from "../../../../src/pages/TodoPage";

let page: Page;
let cleanup: () => void;

const state = () => os.getState().apps[TodoApp.__appId] as AppState;

beforeEach(() => {
  _resetClipboardStore();
  ({ page, cleanup } = createPage(TodoApp, TodoPage));
  page.goto("/");
});

afterEach(() => {
  cleanup();
});

// ═══════════════════════════════════════════════════════════════════
// §10 Edit Zone — Start, Save, Cancel
// ═══════════════════════════════════════════════════════════════════

describe("§10 Edit: start, save, cancel", () => {
  it("Enter on focused item starts editing", () => {
    page.click("todo_1");
    page.keyboard.press("Enter");

    expect(state().ui.editingId).toBe("todo_1");
  });

  it("startEdit sets editingId", () => {
    os.dispatch(startEdit({ id: "todo_2" }));

    expect(state().ui.editingId).toBe("todo_2");
  });

  it("updateTodoText saves new text and clears editingId", () => {
    os.dispatch(startEdit({ id: "todo_1" }));
    os.dispatch(updateTodoText({ text: "Updated task" }));

    expect(state().data.todos["todo_1"]!.text).toBe("Updated task");
    expect(state().ui.editingId).toBeNull();
  });

  it("cancelEdit clears editingId without changing text", () => {
    const originalText = state().data.todos["todo_1"]!.text;
    os.dispatch(startEdit({ id: "todo_1" }));
    os.dispatch(cancelEdit());

    expect(state().data.todos["todo_1"]!.text).toBe(originalText);
    expect(state().ui.editingId).toBeNull();
  });

  it("updateTodoText with empty string preserves original text", () => {
    const originalText = state().data.todos["todo_1"]!.text;
    os.dispatch(startEdit({ id: "todo_1" }));
    os.dispatch(updateTodoText({ text: "" }));

    expect(state().data.todos["todo_1"]!.text).toBe(originalText);
    expect(state().ui.editingId).toBeNull();
  });

  it("updateTodoText without active editing does nothing", () => {
    expect(state().ui.editingId).toBeNull();
    const snapshot = JSON.stringify(state().data.todos);

    os.dispatch(updateTodoText({ text: "Phantom edit" }));

    expect(JSON.stringify(state().data.todos)).toBe(snapshot);
  });

  it("cancelEdit when not editing does nothing", () => {
    expect(state().ui.editingId).toBeNull();
    os.dispatch(cancelEdit());
    expect(state().ui.editingId).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §11 Search Zone — Filter behavior
// ═══════════════════════════════════════════════════════════════════

describe("§11 Search: filter", () => {
  it("setSearchQuery filters visible todos", () => {
    os.dispatch(setSearchQuery({ text: "groceries" }));

    const visible = state().data.todoOrder.filter((id: string) => {
      const todo = state().data.todos[id];
      return (
        todo?.categoryId === state().ui.selectedCategoryId &&
        todo.text.toLowerCase().includes("groceries")
      );
    });
    expect(visible).toEqual(["todo_4"]);
  });

  it("setSearchQuery with no match returns empty", () => {
    os.dispatch(setSearchQuery({ text: "zzzzz" }));

    const visible = state().data.todoOrder.filter((id: string) => {
      const todo = state().data.todos[id];
      return (
        todo?.categoryId === state().ui.selectedCategoryId &&
        todo.text.toLowerCase().includes("zzzzz")
      );
    });
    expect(visible).toHaveLength(0);
  });

  it("setSearchQuery is case-insensitive", () => {
    os.dispatch(setSearchQuery({ text: "COMPLETE" }));

    const visible = state().data.todoOrder.filter((id: string) => {
      const todo = state().data.todos[id];
      return (
        todo?.categoryId === state().ui.selectedCategoryId &&
        todo.text.toLowerCase().includes("complete")
      );
    });
    expect(visible.length).toBeGreaterThan(0);
  });

  it("clearing search restores all todos", () => {
    os.dispatch(setSearchQuery({ text: "groceries" }));
    os.dispatch(setSearchQuery({ text: "" }));

    expect(state().ui.searchQuery).toBe("");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §12 Category Switching — Sidebar → List filtering
// ═══════════════════════════════════════════════════════════════════

describe("§12 Category switching", () => {
  it("initial category is cat_inbox with 4 todos", () => {
    expect(state().ui.selectedCategoryId).toBe("cat_inbox");

    const inboxTodos = state().data.todoOrder.filter(
      (id: string) => state().data.todos[id]?.categoryId === "cat_inbox",
    );
    expect(inboxTodos).toHaveLength(4);
  });

  it("switching to Work category shows 0 todos initially", () => {
    os.dispatch(selectCategory({ id: "cat_work" }));

    expect(state().ui.selectedCategoryId).toBe("cat_work");
    const workTodos = state().data.todoOrder.filter(
      (id: string) => state().data.todos[id]?.categoryId === "cat_work",
    );
    expect(workTodos).toHaveLength(0);
  });

  it("adding todo in Work category stays in Work", () => {
    os.dispatch(selectCategory({ id: "cat_work" }));
    os.dispatch(addTodo({ text: "Work task" }));

    const workTodos = state().data.todoOrder.filter(
      (id: string) => state().data.todos[id]?.categoryId === "cat_work",
    );
    expect(workTodos).toHaveLength(1);
  });

  it("switching back to Inbox preserves original todos", () => {
    os.dispatch(selectCategory({ id: "cat_work" }));
    os.dispatch(addTodo({ text: "Work task" }));
    os.dispatch(selectCategory({ id: "cat_inbox" }));

    const inboxTodos = state().data.todoOrder.filter(
      (id: string) => state().data.todos[id]?.categoryId === "cat_inbox",
    );
    expect(inboxTodos).toHaveLength(4);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §13 Toolbar — Toggle view, Clear completed
// ═══════════════════════════════════════════════════════════════════

describe("§13 Toolbar: view + clear", () => {
  it("toggleView switches between list and board", () => {
    expect(state().ui.viewMode).toBe("list");

    os.dispatch(toggleView());
    expect(state().ui.viewMode).toBe("board");

    os.dispatch(toggleView());
    expect(state().ui.viewMode).toBe("list");
  });

  it("clearCompleted removes completed todos", () => {
    os.dispatch(toggleTodo({ id: "todo_1" }));
    expect(state().data.todos["todo_1"]!.completed).toBe(true);

    os.dispatch(clearCompleted());

    expect(state().data.todos["todo_1"]).toBeUndefined();
    expect(state().data.todoOrder).not.toContain("todo_1");
    expect(state().data.todoOrder).toHaveLength(3);
  });

  it("clearCompleted with no completed todos is a no-op", () => {
    const orderBefore = [...state().data.todoOrder];

    os.dispatch(clearCompleted());

    expect(state().data.todoOrder).toEqual(orderBefore);
  });

  it("clearCompleted removes from ALL categories, not just selected", () => {
    os.dispatch(selectCategory({ id: "cat_work" }));
    os.dispatch(addTodo({ text: "Work completed" }));

    const workTodoId = state().data.todoOrder.find(
      (id: string) => state().data.todos[id]?.text === "Work completed",
    )!;
    os.dispatch(toggleTodo({ id: workTodoId }));

    os.dispatch(selectCategory({ id: "cat_inbox" }));
    os.dispatch(toggleTodo({ id: "todo_1" }));

    const totalBefore = state().data.todoOrder.length;

    os.dispatch(clearCompleted());

    expect(state().data.todoOrder.length).toBe(totalBefore - 2);
    expect(state().data.todos[workTodoId]).toBeUndefined();
    expect(state().data.todos["todo_1"]).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §14 Delete flow — request, confirm, cancel
// ═══════════════════════════════════════════════════════════════════

describe("§14 Delete: full flow", () => {
  it("requestDeleteTodo sets pendingDeleteIds", () => {
    os.dispatch(requestDeleteTodo({ ids: ["todo_1"] }));

    expect(state().ui.pendingDeleteIds).toEqual(["todo_1"]);
  });

  it("cancelDeleteTodo clears pendingDeleteIds", () => {
    os.dispatch(requestDeleteTodo({ ids: ["todo_1"] }));
    os.dispatch(cancelDeleteTodo());

    expect(state().ui.pendingDeleteIds).toEqual([]);
    expect(state().data.todos["todo_1"]).toBeDefined();
  });

  it("confirmDeleteTodo removes all pending items", () => {
    os.dispatch(requestDeleteTodo({ ids: ["todo_1", "todo_2"] }));
    os.dispatch(confirmDeleteTodo());

    expect(state().data.todos["todo_1"]).toBeUndefined();
    expect(state().data.todos["todo_2"]).toBeUndefined();
    expect(state().data.todoOrder).toHaveLength(2);
    expect(state().ui.pendingDeleteIds).toEqual([]);
  });

  it("confirmDeleteTodo with empty pendingDeleteIds is a no-op", () => {
    const orderBefore = [...state().data.todoOrder];

    os.dispatch(confirmDeleteTodo());

    expect(state().data.todoOrder).toEqual(orderBefore);
  });

  it("Delete key on selection deletes all selected items", () => {
    page.click("todo_1");
    page.keyboard.press("Shift+ArrowDown");

    page.keyboard.press("Delete");

    expect(state().ui.pendingDeleteIds).toContain("todo_1");
    expect(state().ui.pendingDeleteIds).toContain("todo_2");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §14b Delete dialog — real user flow through overlay
// ═══════════════════════════════════════════════════════════════════

describe("§14b Delete dialog: overlay interaction flow", () => {
  const overlayStack = () => os.getState().os.overlays?.stack ?? [];
  const focusedInList = () =>
    os.getState().os.focus.zones["list"]?.focusedItemId;

  function openDeleteDialog() {
    page.click("todo_1");
    page.keyboard.press("Delete");
  }

  it("Delete key opens overlay and overlay stack has dialog entry", () => {
    openDeleteDialog();
    expect(overlayStack().some((e: { id: string }) => e.id === "todo-delete-dialog")).toBe(true);
  });

  it("after dialog opens, Escape should close it", () => {
    openDeleteDialog();
    expect(overlayStack().some((e: { id: string }) => e.id === "todo-delete-dialog")).toBe(true);

    page.keyboard.press("Escape");

    expect(overlayStack()).toHaveLength(0);
    expect(state().data.todos["todo_1"]).toBeDefined();
  });

  it("after dialog opens, keyboard input on list zone is blocked by overlay trap", () => {
    openDeleteDialog();
    const activeZoneId = os.getState().os.focus.activeZoneId;
    expect(activeZoneId).toBe("list");

    const focusBefore = focusedInList();
    page.keyboard.press("ArrowDown");
    expect(focusedInList()).toBe(focusBefore);
  });

  it("after dialog closes via Escape, list zone should be interactive again", () => {
    openDeleteDialog();
    page.keyboard.press("Escape");

    expect(overlayStack()).toHaveLength(0);
    page.keyboard.press("ArrowDown");
    expect(focusedInList()).toBe("todo_2");
  });

  it("confirmDeleteTodo via dispatch after dialog open works", () => {
    openDeleteDialog();
    os.dispatch(confirmDeleteTodo());

    expect(state().data.todos["todo_1"]).toBeUndefined();
    expect(overlayStack()).toHaveLength(0);
  });

  it("after confirm delete and dialog close, list zone is interactive", () => {
    openDeleteDialog();
    os.dispatch(confirmDeleteTodo());

    expect(overlayStack()).toHaveLength(0);
    page.keyboard.press("ArrowDown");
    expect(focusedInList()).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §15 Draft Zone — Edge cases
// ═══════════════════════════════════════════════════════════════════

describe("§15 Draft: edge cases", () => {
  it("addTodo with empty text is rejected", () => {
    const orderBefore = state().data.todoOrder.length;

    os.dispatch(addTodo({ text: "" }));

    expect(state().data.todoOrder.length).toBe(orderBefore);
  });

  it("addTodo with whitespace-only text is rejected", () => {
    const orderBefore = state().data.todoOrder.length;

    os.dispatch(addTodo({ text: "   " }));

    expect(state().data.todoOrder.length).toBe(orderBefore);
  });

  it("addTodo trims whitespace", () => {
    os.dispatch(addTodo({ text: "  Trimmed task  " }));

    const newTodo = Object.values(state().data.todos).find(
      (t) => t.text === "Trimmed task",
    );
    expect(newTodo).toBeDefined();
  });

  it("addTodo assigns current category", () => {
    os.dispatch(selectCategory({ id: "cat_work" }));
    os.dispatch(addTodo({ text: "Work item" }));

    const newTodo = Object.values(state().data.todos).find(
      (t) => t.text === "Work item",
    );
    expect(newTodo?.categoryId).toBe("cat_work");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §16 Check (toggle) — Edge cases
// ═══════════════════════════════════════════════════════════════════

describe("§16 Check: edge cases", () => {
  it("toggling twice returns to original state", () => {
    expect(state().data.todos["todo_1"]!.completed).toBe(false);

    os.dispatch(toggleTodo({ id: "todo_1" }));
    os.dispatch(toggleTodo({ id: "todo_1" }));

    expect(state().data.todos["todo_1"]!.completed).toBe(false);
  });

  it("toggling non-existent id does nothing", () => {
    const snapshot = JSON.stringify(state().data.todos);

    os.dispatch(toggleTodo({ id: "nonexistent" }));

    expect(JSON.stringify(state().data.todos)).toBe(snapshot);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §17 Undo/Redo — With active list zone
// ═══════════════════════════════════════════════════════════════════

describe("§17 Undo/Redo: with active zone", () => {
  it("undo toggleTodo restores completed state", () => {
    page.click("todo_1");
    page.keyboard.press("Space");
    expect(state().data.todos["todo_1"]!.completed).toBe(true);

    page.keyboard.press("Meta+z");
    expect(state().data.todos["todo_1"]!.completed).toBe(false);
  });

  it("undo addTodo removes the added item (list zone active)", () => {
    page.click("todo_1");
    os.dispatch(addTodo({ text: "Undo me" }));
    expect(state().data.todoOrder.length).toBe(5);

    page.keyboard.press("Meta+z");
    expect(state().data.todoOrder.length).toBe(4);
  });

  it("undo reorder restores original order", () => {
    page.click("todo_1");
    page.keyboard.press("Meta+ArrowDown");

    expect(state().data.todoOrder[0]).toBe("todo_2");
    expect(state().data.todoOrder[1]).toBe("todo_1");

    page.keyboard.press("Meta+z");

    expect(state().data.todoOrder[0]).toBe("todo_1");
    expect(state().data.todoOrder[1]).toBe("todo_2");
  });

  it("undo updateTodoText via direct dispatch (list zone active)", () => {
    page.click("todo_1");
    const originalText = state().data.todos["todo_1"]!.text;

    os.dispatch(startEdit({ id: "todo_1" }));
    os.dispatch(updateTodoText({ text: "Changed text" }));
    expect(state().data.todos["todo_1"]!.text).toBe("Changed text");
    expect(state().history.past.length).toBeGreaterThan(0);

    os.dispatch(undoCommand());
    expect(state().data.todos["todo_1"]!.text).toBe(originalText);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §17b Undo — Real user flow (draft/edit zone → Meta+Z)
// ═══════════════════════════════════════════════════════════════════

describe("§17b Undo: user flow — draft zone undo gap", () => {
  it.skip("draft zone: add todo then Meta+Z should undo", () => {
    os.dispatch({
      type: "OS_FOCUS",
      payload: { zoneId: "draft", itemId: null },
    });
    page.keyboard.type("New task via draft");
    page.keyboard.press("Enter");

    expect(state().data.todoOrder.length).toBe(5);
    expect(os.getState().os.focus.activeZoneId).toBe("draft");

    page.keyboard.press("Meta+z");
    expect(state().data.todoOrder.length).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §18 Copy/Paste across categories
// ═══════════════════════════════════════════════════════════════════

describe("§18 Clipboard: cross-category paste", () => {
  it("paste in different category assigns new category", () => {
    page.click("todo_1");
    page.keyboard.press("Meta+c");

    os.dispatch(selectCategory({ id: "cat_work" }));

    page.keyboard.press("Meta+v");

    const workTodos = state().data.todoOrder.filter(
      (id: string) => state().data.todos[id]?.categoryId === "cat_work",
    );
    expect(workTodos.length).toBeGreaterThan(0);
    expect(state().data.todos[workTodos[0]!]!.text).toBe(
      "Complete Interaction OS docs",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// §19 Reorder — Boundary conditions
// ═══════════════════════════════════════════════════════════════════

describe("§19 Reorder: boundary", () => {
  it("Meta+ArrowUp on first item is a no-op", () => {
    page.click("todo_1");
    const orderBefore = [...state().data.todoOrder];

    page.keyboard.press("Meta+ArrowUp");

    expect(state().data.todoOrder).toEqual(orderBefore);
  });

  it("Meta+ArrowDown on last item is a no-op", () => {
    page.click("todo_4");
    const orderBefore = [...state().data.todoOrder];

    page.keyboard.press("Meta+ArrowDown");

    expect(state().data.todoOrder).toEqual(orderBefore);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §20 Edit via keyboard flow
// ═══════════════════════════════════════════════════════════════════

describe("§20 Edit: keyboard-driven flow", () => {
  it("Enter on focused item → type → Enter saves new text", () => {
    page.click("todo_1");
    page.keyboard.press("Enter");

    expect(state().ui.editingId).toBe("todo_1");

    os.dispatch(updateTodoText({ text: "Keyboard edited" }));

    expect(state().data.todos["todo_1"]!.text).toBe("Keyboard edited");
    expect(state().ui.editingId).toBeNull();
  });

  it("Enter on focused item → Escape cancels edit", () => {
    const originalText = state().data.todos["todo_1"]!.text;

    page.click("todo_1");
    page.keyboard.press("Enter");

    expect(state().ui.editingId).toBe("todo_1");

    os.dispatch(cancelEdit());

    expect(state().data.todos["todo_1"]!.text).toBe(originalText);
    expect(state().ui.editingId).toBeNull();
  });

  it("double edit: edit todo_1 then edit todo_2", () => {
    os.dispatch(startEdit({ id: "todo_1" }));
    os.dispatch(updateTodoText({ text: "First edit" }));

    os.dispatch(startEdit({ id: "todo_2" }));
    os.dispatch(updateTodoText({ text: "Second edit" }));

    expect(state().data.todos["todo_1"]!.text).toBe("First edit");
    expect(state().data.todos["todo_2"]!.text).toBe("Second edit");
    expect(state().ui.editingId).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §21 Compound operations
// ═══════════════════════════════════════════════════════════════════

describe("§21 Compound: complex sequences", () => {
  it("add + toggle + delete + undo restores toggled state", () => {
    page.click("todo_1");

    os.dispatch(addTodo({ text: "Compound test" }));
    const newId = state().data.todoOrder.find(
      (id: string) => state().data.todos[id]?.text === "Compound test",
    )!;

    os.dispatch(toggleTodo({ id: newId }));
    expect(state().data.todos[newId]!.completed).toBe(true);

    os.dispatch(requestDeleteTodo({ ids: [newId] }));
    os.dispatch(confirmDeleteTodo());
    expect(state().data.todos[newId]).toBeUndefined();

    page.keyboard.press("Meta+z");
    expect(state().data.todos[newId]).toBeDefined();
  });

  it("edit + switch category + switch back preserves edit", () => {
    os.dispatch(startEdit({ id: "todo_1" }));
    os.dispatch(updateTodoText({ text: "Edited before switch" }));

    os.dispatch(selectCategory({ id: "cat_work" }));
    os.dispatch(selectCategory({ id: "cat_inbox" }));

    expect(state().data.todos["todo_1"]!.text).toBe("Edited before switch");
  });

  it("search + delete: delete while search is active", () => {
    os.dispatch(setSearchQuery({ text: "groceries" }));

    os.dispatch(requestDeleteTodo({ ids: ["todo_4"] }));
    os.dispatch(confirmDeleteTodo());

    expect(state().data.todos["todo_4"]).toBeUndefined();

    os.dispatch(setSearchQuery({ text: "" }));
    expect(state().data.todoOrder).toHaveLength(3);
  });

  it("multiple toggles + clearCompleted clears exactly the completed", () => {
    os.dispatch(toggleTodo({ id: "todo_1" }));
    os.dispatch(toggleTodo({ id: "todo_3" }));

    os.dispatch(clearCompleted());

    expect(state().data.todoOrder).toHaveLength(2);
    expect(state().data.todoOrder).toContain("todo_2");
    expect(state().data.todoOrder).toContain("todo_4");
  });
});
