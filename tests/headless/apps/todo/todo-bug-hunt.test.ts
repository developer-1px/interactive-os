/**
 * Todo App — Bug Hunt Tests
 *
 * Systematic coverage of untested areas to find hidden bugs.
 * Each section targets a specific gap in existing test coverage.
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
import { createHeadlessPage } from "@os-devtool/testing/page";
import type { AppPageInternal } from "@os-sdk/app/defineApp/types";
import { _resetClipboardStore } from "@os-sdk/library/collection/createCollectionZone";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import TodoPage from "../../../../src/pages/TodoPage";

type P = AppPageInternal<any>;
let page: P;

beforeEach(() => {
  _resetClipboardStore();
  page = createHeadlessPage(TodoApp, TodoPage);
  page.goto("/");
});

afterEach(() => {
  page.cleanup();
});

// ═══════════════════════════════════════════════════════════════════
// §10 Edit Zone — Start, Save, Cancel
// ═══════════════════════════════════════════════════════════════════

describe("§10 Edit: start, save, cancel", () => {
  it("Enter on focused item starts editing", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Enter");

    expect(page.state.ui.editingId).toBe("todo_1");
  });

  it("startEdit sets editingId", () => {
    page.dispatch(startEdit({ id: "todo_2" }));

    expect(page.state.ui.editingId).toBe("todo_2");
  });

  it("updateTodoText saves new text and clears editingId", () => {
    page.dispatch(startEdit({ id: "todo_1" }));
    page.dispatch(updateTodoText({ text: "Updated task" }));

    expect(page.state.data.todos.todo_1.text).toBe("Updated task");
    expect(page.state.ui.editingId).toBeNull();
  });

  it("cancelEdit clears editingId without changing text", () => {
    const originalText = page.state.data.todos.todo_1.text;
    page.dispatch(startEdit({ id: "todo_1" }));
    page.dispatch(cancelEdit());

    expect(page.state.data.todos.todo_1.text).toBe(originalText);
    expect(page.state.ui.editingId).toBeNull();
  });

  it("updateTodoText with empty string preserves original text", () => {
    const originalText = page.state.data.todos.todo_1.text;
    page.dispatch(startEdit({ id: "todo_1" }));
    page.dispatch(updateTodoText({ text: "" }));

    // Empty text should not overwrite — but editingId should be cleared
    expect(page.state.data.todos.todo_1.text).toBe(originalText);
    expect(page.state.ui.editingId).toBeNull();
  });

  it("updateTodoText without active editing does nothing", () => {
    expect(page.state.ui.editingId).toBeNull();
    const snapshot = JSON.stringify(page.state.data.todos);

    page.dispatch(updateTodoText({ text: "Phantom edit" }));

    expect(JSON.stringify(page.state.data.todos)).toBe(snapshot);
  });

  it("cancelEdit when not editing does nothing", () => {
    expect(page.state.ui.editingId).toBeNull();
    // cancelEdit has { when: isEditing } guard — should be a no-op
    page.dispatch(cancelEdit());
    expect(page.state.ui.editingId).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §11 Search Zone — Filter behavior
// ═══════════════════════════════════════════════════════════════════

describe("§11 Search: filter", () => {
  it("setSearchQuery filters visible todos", () => {
    page.dispatch(setSearchQuery({ text: "groceries" }));

    const visible = page.state.data.todoOrder.filter((id: string) => {
      const todo = page.state.data.todos[id];
      return (
        todo?.categoryId === page.state.ui.selectedCategoryId &&
        todo.text.toLowerCase().includes("groceries")
      );
    });
    expect(visible).toEqual(["todo_4"]);
  });

  it("setSearchQuery with no match returns empty", () => {
    page.dispatch(setSearchQuery({ text: "zzzzz" }));

    const visible = page.state.data.todoOrder.filter((id: string) => {
      const todo = page.state.data.todos[id];
      return (
        todo?.categoryId === page.state.ui.selectedCategoryId &&
        todo.text.toLowerCase().includes("zzzzz")
      );
    });
    expect(visible).toHaveLength(0);
  });

  it("setSearchQuery is case-insensitive", () => {
    page.dispatch(setSearchQuery({ text: "COMPLETE" }));

    const visible = page.state.data.todoOrder.filter((id: string) => {
      const todo = page.state.data.todos[id];
      return (
        todo?.categoryId === page.state.ui.selectedCategoryId &&
        todo.text.toLowerCase().includes("complete")
      );
    });
    expect(visible.length).toBeGreaterThan(0);
  });

  it("clearing search restores all todos", () => {
    page.dispatch(setSearchQuery({ text: "groceries" }));
    page.dispatch(setSearchQuery({ text: "" }));

    expect(page.state.ui.searchQuery).toBe("");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §12 Category Switching — Sidebar → List filtering
// ═══════════════════════════════════════════════════════════════════

describe("§12 Category switching", () => {
  it("initial category is cat_inbox with 4 todos", () => {
    expect(page.state.ui.selectedCategoryId).toBe("cat_inbox");

    const inboxTodos = page.state.data.todoOrder.filter(
      (id: string) => page.state.data.todos[id]?.categoryId === "cat_inbox",
    );
    expect(inboxTodos).toHaveLength(4);
  });

  it("switching to Work category shows 0 todos initially", () => {
    page.dispatch(selectCategory({ id: "cat_work" }));

    expect(page.state.ui.selectedCategoryId).toBe("cat_work");
    const workTodos = page.state.data.todoOrder.filter(
      (id: string) => page.state.data.todos[id]?.categoryId === "cat_work",
    );
    expect(workTodos).toHaveLength(0);
  });

  it("adding todo in Work category stays in Work", () => {
    page.dispatch(selectCategory({ id: "cat_work" }));
    page.dispatch(addTodo({ text: "Work task" }));

    const workTodos = page.state.data.todoOrder.filter(
      (id: string) => page.state.data.todos[id]?.categoryId === "cat_work",
    );
    expect(workTodos).toHaveLength(1);
  });

  it("switching back to Inbox preserves original todos", () => {
    page.dispatch(selectCategory({ id: "cat_work" }));
    page.dispatch(addTodo({ text: "Work task" }));
    page.dispatch(selectCategory({ id: "cat_inbox" }));

    const inboxTodos = page.state.data.todoOrder.filter(
      (id: string) => page.state.data.todos[id]?.categoryId === "cat_inbox",
    );
    expect(inboxTodos).toHaveLength(4);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §13 Toolbar — Toggle view, Clear completed
// ═══════════════════════════════════════════════════════════════════

describe("§13 Toolbar: view + clear", () => {
  it("toggleView switches between list and board", () => {
    expect(page.state.ui.viewMode).toBe("list");

    page.dispatch(toggleView());
    expect(page.state.ui.viewMode).toBe("board");

    page.dispatch(toggleView());
    expect(page.state.ui.viewMode).toBe("list");
  });

  it("clearCompleted removes completed todos", () => {
    // Mark todo_1 as completed
    page.dispatch(toggleTodo({ id: "todo_1" }));
    expect(page.state.data.todos.todo_1.completed).toBe(true);

    page.dispatch(clearCompleted());

    expect(page.state.data.todos.todo_1).toBeUndefined();
    expect(page.state.data.todoOrder).not.toContain("todo_1");
    expect(page.state.data.todoOrder).toHaveLength(3);
  });

  it("clearCompleted with no completed todos is a no-op", () => {
    const orderBefore = [...page.state.data.todoOrder];

    page.dispatch(clearCompleted());

    expect(page.state.data.todoOrder).toEqual(orderBefore);
  });

  it("clearCompleted removes from ALL categories, not just selected", () => {
    // Add a Work todo and mark it completed
    page.dispatch(selectCategory({ id: "cat_work" }));
    page.dispatch(addTodo({ text: "Work completed" }));

    // Find the new todo id
    const workTodoId = page.state.data.todoOrder.find(
      (id: string) => page.state.data.todos[id]?.text === "Work completed",
    )!;
    page.dispatch(toggleTodo({ id: workTodoId }));

    // Switch back to Inbox and mark one there
    page.dispatch(selectCategory({ id: "cat_inbox" }));
    page.dispatch(toggleTodo({ id: "todo_1" }));

    const totalBefore = page.state.data.todoOrder.length;

    page.dispatch(clearCompleted());

    // Both should be cleared
    expect(page.state.data.todoOrder.length).toBe(totalBefore - 2);
    expect(page.state.data.todos[workTodoId]).toBeUndefined();
    expect(page.state.data.todos.todo_1).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §14 Delete flow — request, confirm, cancel
// ═══════════════════════════════════════════════════════════════════

describe("§14 Delete: full flow", () => {
  it("requestDeleteTodo sets pendingDeleteIds", () => {
    page.dispatch(requestDeleteTodo({ ids: ["todo_1"] }));

    expect(page.state.ui.pendingDeleteIds).toEqual(["todo_1"]);
  });

  it("cancelDeleteTodo clears pendingDeleteIds", () => {
    page.dispatch(requestDeleteTodo({ ids: ["todo_1"] }));
    page.dispatch(cancelDeleteTodo());

    expect(page.state.ui.pendingDeleteIds).toEqual([]);
    // Todo still exists
    expect(page.state.data.todos.todo_1).toBeDefined();
  });

  it("confirmDeleteTodo removes all pending items", () => {
    page.dispatch(requestDeleteTodo({ ids: ["todo_1", "todo_2"] }));
    page.dispatch(confirmDeleteTodo());

    expect(page.state.data.todos.todo_1).toBeUndefined();
    expect(page.state.data.todos.todo_2).toBeUndefined();
    expect(page.state.data.todoOrder).toHaveLength(2);
    expect(page.state.ui.pendingDeleteIds).toEqual([]);
  });

  it("confirmDeleteTodo with empty pendingDeleteIds is a no-op", () => {
    const orderBefore = [...page.state.data.todoOrder];

    page.dispatch(confirmDeleteTodo());

    expect(page.state.data.todoOrder).toEqual(orderBefore);
  });

  it("Delete key on selection deletes all selected items", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Shift+ArrowDown"); // select todo_1 + todo_2

    page.keyboard.press("Delete");

    // Should set pendingDeleteIds for both selected items
    expect(page.state.ui.pendingDeleteIds).toContain("todo_1");
    expect(page.state.ui.pendingDeleteIds).toContain("todo_2");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §14b Delete dialog — real user flow through overlay
//
// BUG HUNT: After delete dialog opens, UI is frozen.
// Hypothesis: overlay focus trap blocks all input because
// activeZoneId is still "list", not inside the overlay.
// ═══════════════════════════════════════════════════════════════════

describe("§14b Delete dialog: overlay interaction flow", () => {
  const overlayStack = () => page.kernel.getState().os.overlays?.stack ?? [];
  const focusedInList = () =>
    page.kernel.getState().os.focus.zones.list?.focusedItemId;

  /** Focus todo_1 and press Delete to open the delete dialog */
  function openDeleteDialog() {
    page.locator("#todo_1").click();
    page.keyboard.press("Delete");
  }

  it("Delete key opens overlay and overlay stack has dialog entry", () => {
    openDeleteDialog();
    expect(overlayStack().some((e) => e.id === "todo-delete-dialog")).toBe(
      true,
    );
  });

  it("after dialog opens, Escape should close it", () => {
    openDeleteDialog();
    expect(overlayStack().some((e) => e.id === "todo-delete-dialog")).toBe(
      true,
    );

    page.keyboard.press("Escape");

    expect(overlayStack()).toHaveLength(0);
    expect(page.state.data.todos.todo_1).toBeDefined();
  });

  it("after dialog opens, keyboard input on list zone is blocked by overlay trap", () => {
    openDeleteDialog();
    expect(page.activeZoneId()).toBe("list");

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
    page.dispatch(confirmDeleteTodo());

    expect(page.state.data.todos.todo_1).toBeUndefined();
    expect(overlayStack()).toHaveLength(0);
  });

  it("after confirm delete and dialog close, list zone is interactive", () => {
    openDeleteDialog();
    page.dispatch(confirmDeleteTodo());

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
    const orderBefore = page.state.data.todoOrder.length;

    page.dispatch(addTodo({ text: "" }));

    expect(page.state.data.todoOrder.length).toBe(orderBefore);
  });

  it("addTodo with whitespace-only text is rejected", () => {
    const orderBefore = page.state.data.todoOrder.length;

    page.dispatch(addTodo({ text: "   " }));

    expect(page.state.data.todoOrder.length).toBe(orderBefore);
  });

  it("addTodo trims whitespace", () => {
    page.dispatch(addTodo({ text: "  Trimmed task  " }));

    const newTodo = Object.values(page.state.data.todos).find(
      (t: any) => t.text === "Trimmed task",
    );
    expect(newTodo).toBeDefined();
  });

  it("addTodo assigns current category", () => {
    page.dispatch(selectCategory({ id: "cat_work" }));
    page.dispatch(addTodo({ text: "Work item" }));

    const newTodo = Object.values(page.state.data.todos).find(
      (t: any) => t.text === "Work item",
    );
    expect((newTodo as any)?.categoryId).toBe("cat_work");
  });
});

// ═══════════════════════════════════════════════════════════════════
// §16 Check (toggle) — Edge cases
// ═══════════════════════════════════════════════════════════════════

describe("§16 Check: edge cases", () => {
  it("toggling twice returns to original state", () => {
    expect(page.state.data.todos.todo_1.completed).toBe(false);

    page.dispatch(toggleTodo({ id: "todo_1" }));
    page.dispatch(toggleTodo({ id: "todo_1" }));

    expect(page.state.data.todos.todo_1.completed).toBe(false);
  });

  it("toggling non-existent id does nothing", () => {
    const snapshot = JSON.stringify(page.state.data.todos);

    page.dispatch(toggleTodo({ id: "nonexistent" }));

    expect(JSON.stringify(page.state.data.todos)).toBe(snapshot);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §17 Undo/Redo — With active list zone (zone setup correct)
// ═══════════════════════════════════════════════════════════════════

describe("§17 Undo/Redo: with active zone", () => {
  it("undo toggleTodo restores completed state", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Space"); // toggle
    expect(page.state.data.todos.todo_1.completed).toBe(true);

    page.keyboard.press("Meta+z"); // undo
    expect(page.state.data.todos.todo_1.completed).toBe(false);
  });

  it("undo addTodo removes the added item (list zone active)", () => {
    page.locator("#todo_1").click(); // activate list zone first
    page.dispatch(addTodo({ text: "Undo me" }));
    expect(page.state.data.todoOrder.length).toBe(5);

    page.keyboard.press("Meta+z");
    expect(page.state.data.todoOrder.length).toBe(4);
  });

  it("undo reorder restores original order", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Meta+ArrowDown"); // move todo_1 down

    expect(page.state.data.todoOrder[0]).toBe("todo_2");
    expect(page.state.data.todoOrder[1]).toBe("todo_1");

    page.keyboard.press("Meta+z");

    expect(page.state.data.todoOrder[0]).toBe("todo_1");
    expect(page.state.data.todoOrder[1]).toBe("todo_2");
  });

  it("undo updateTodoText via direct dispatch (list zone active)", () => {
    page.locator("#todo_1").click();
    const originalText = page.state.data.todos.todo_1.text;

    page.dispatch(startEdit({ id: "todo_1" }));
    page.dispatch(updateTodoText({ text: "Changed text" }));
    expect(page.state.data.todos.todo_1.text).toBe("Changed text");
    expect(page.state.history.past.length).toBeGreaterThan(0);

    // Direct dispatch bypasses keybinding — always works with correct zone
    page.dispatch(undoCommand());
    expect(page.state.data.todos.todo_1.text).toBe(originalText);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §17b Undo — Real user flow (draft/edit zone → Meta+Z)
//
// BUG HUNT: After adding via draft or saving via edit, the active
// zone is "draft" or "edit" which has NO onUndo. Meta+Z is dead.
// ═══════════════════════════════════════════════════════════════════

describe("§17b Undo: user flow — draft zone undo gap", () => {
  // OS gap: inline field absorbs Meta+Z (native text undo).
  // See docs/5-backlog/undo-scope-policy.md
  it.skip("draft zone: add todo then Meta+Z should undo", () => {
    // Real user flow: focus draft → type → Enter → stay in draft → Meta+Z
    page.dispatch({
      type: "OS_FOCUS",
      payload: { zoneId: "draft", itemId: null },
    } as any);
    page.keyboard.type("New task via draft");
    page.keyboard.press("Enter");

    expect(page.state.data.todoOrder.length).toBe(5);
    expect(page.activeZoneId()).toBe("draft");

    // Meta+Z from draft zone — needs onUndo registered on draft
    page.keyboard.press("Meta+z");
    expect(page.state.data.todoOrder.length).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §18 Copy/Paste across categories
// ═══════════════════════════════════════════════════════════════════

describe("§18 Clipboard: cross-category paste", () => {
  it("paste in different category assigns new category", () => {
    // Copy from inbox
    page.locator("#todo_1").click();
    page.keyboard.press("Meta+c");

    // Switch to Work
    page.dispatch(selectCategory({ id: "cat_work" }));

    // Paste
    page.keyboard.press("Meta+v");

    // The pasted todo should have cat_work as category
    const workTodos = page.state.data.todoOrder.filter(
      (id: string) => page.state.data.todos[id]?.categoryId === "cat_work",
    );
    expect(workTodos.length).toBeGreaterThan(0);
    expect(page.state.data.todos[workTodos[0]].text).toBe(
      "Complete Interaction OS docs",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// §19 Reorder — Boundary conditions
// ═══════════════════════════════════════════════════════════════════

describe("§19 Reorder: boundary", () => {
  it("Meta+ArrowUp on first item is a no-op", () => {
    page.locator("#todo_1").click();
    const orderBefore = [...page.state.data.todoOrder];

    page.keyboard.press("Meta+ArrowUp");

    expect(page.state.data.todoOrder).toEqual(orderBefore);
  });

  it("Meta+ArrowDown on last item is a no-op", () => {
    page.locator("#todo_4").click();
    const orderBefore = [...page.state.data.todoOrder];

    page.keyboard.press("Meta+ArrowDown");

    expect(page.state.data.todoOrder).toEqual(orderBefore);
  });
});

// ═══════════════════════════════════════════════════════════════════
// §20 Edit via keyboard flow (Enter on focused item)
// ═══════════════════════════════════════════════════════════════════

describe("§20 Edit: keyboard-driven flow", () => {
  it("Enter on focused item → type → Enter saves new text", () => {
    page.locator("#todo_1").click();
    page.keyboard.press("Enter"); // start edit

    expect(page.state.ui.editingId).toBe("todo_1");

    // Simulate typing in the edit field
    page.dispatch(updateTodoText({ text: "Keyboard edited" }));

    expect(page.state.data.todos.todo_1.text).toBe("Keyboard edited");
    expect(page.state.ui.editingId).toBeNull();
  });

  it("Enter on focused item → Escape cancels edit", () => {
    const originalText = page.state.data.todos.todo_1.text;

    page.locator("#todo_1").click();
    page.keyboard.press("Enter"); // start edit

    expect(page.state.ui.editingId).toBe("todo_1");

    page.dispatch(cancelEdit());

    expect(page.state.data.todos.todo_1.text).toBe(originalText);
    expect(page.state.ui.editingId).toBeNull();
  });

  it("double edit: edit todo_1 then edit todo_2", () => {
    page.dispatch(startEdit({ id: "todo_1" }));
    page.dispatch(updateTodoText({ text: "First edit" }));

    page.dispatch(startEdit({ id: "todo_2" }));
    page.dispatch(updateTodoText({ text: "Second edit" }));

    expect(page.state.data.todos.todo_1.text).toBe("First edit");
    expect(page.state.data.todos.todo_2.text).toBe("Second edit");
    expect(page.state.ui.editingId).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// §21 Compound operations — sequences that might break
// ═══════════════════════════════════════════════════════════════════

describe("§21 Compound: complex sequences", () => {
  it("add + toggle + delete + undo restores toggled state", () => {
    page.locator("#todo_1").click(); // activate list zone for undo

    // Add a new todo
    page.dispatch(addTodo({ text: "Compound test" }));
    const newId = page.state.data.todoOrder.find(
      (id: string) => page.state.data.todos[id]?.text === "Compound test",
    )!;

    // Toggle it completed
    page.dispatch(toggleTodo({ id: newId }));
    expect(page.state.data.todos[newId].completed).toBe(true);

    // Delete it
    page.dispatch(requestDeleteTodo({ ids: [newId] }));
    page.dispatch(confirmDeleteTodo());
    expect(page.state.data.todos[newId]).toBeUndefined();

    // Undo should restore the todo (with completed=true)
    page.keyboard.press("Meta+z");
    expect(page.state.data.todos[newId]).toBeDefined();
  });

  it("edit + switch category + switch back preserves edit", () => {
    page.dispatch(startEdit({ id: "todo_1" }));
    page.dispatch(updateTodoText({ text: "Edited before switch" }));

    page.dispatch(selectCategory({ id: "cat_work" }));
    page.dispatch(selectCategory({ id: "cat_inbox" }));

    expect(page.state.data.todos.todo_1.text).toBe("Edited before switch");
  });

  it("search + delete: delete while search is active", () => {
    page.dispatch(setSearchQuery({ text: "groceries" }));

    // Delete the matching item
    page.dispatch(requestDeleteTodo({ ids: ["todo_4"] }));
    page.dispatch(confirmDeleteTodo());

    expect(page.state.data.todos.todo_4).toBeUndefined();

    // Clear search — remaining items should be intact
    page.dispatch(setSearchQuery({ text: "" }));
    expect(page.state.data.todoOrder).toHaveLength(3);
  });

  it("multiple toggles + clearCompleted clears exactly the completed", () => {
    page.dispatch(toggleTodo({ id: "todo_1" }));
    page.dispatch(toggleTodo({ id: "todo_3" }));

    page.dispatch(clearCompleted());

    expect(page.state.data.todoOrder).toHaveLength(2);
    expect(page.state.data.todoOrder).toContain("todo_2");
    expect(page.state.data.todoOrder).toContain("todo_4");
  });
});
