/**
 * Todo Headless Tests — Vitest
 *
 * Pure kernel state-transition tests. No DOM, no browser.
 * dispatch → getState → assert.
 */

import { todoSlice } from "@apps/todo/app";
import { DuplicateTodo } from "@apps/todo/features/commands/clipboard";
import { RedoCommand, UndoCommand } from "@apps/todo/features/commands/history";
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
  MoveCategoryDown,
  MoveCategoryUp,
  SelectCategory,
} from "@apps/todo/features/commands/MoveCategoryUp";
import { ToggleView } from "@apps/todo/features/commands/ToggleView";
import type { AppState } from "@apps/todo/model/appState";
// ── Selectors ──
import {
  selectCategories,
  selectEditingTodo,
  selectStats,
  selectTodosByCategory,
  selectVisibleTodos,
} from "@apps/todo/selectors";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { kernel } from "@/os/kernel";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

let snap: ReturnType<typeof kernel.getState>;
let idCounter = 0;

function state(): AppState {
  return todoSlice.getState();
}

function d(cmd: any) {
  kernel.dispatch(cmd);
}

/** Add a todo with a unique text label to avoid Date.now() ID collisions. */
function addTodo(label: string): number {
  const uniqueLabel = `${label}_${++idCounter}`;
  d(AddTodo({ text: uniqueLabel }));
  const todo = selectVisibleTodos(state()).find((t) => t.text === uniqueLabel);
  if (!todo) throw new Error(`addTodo failed for "${uniqueLabel}"`);
  return todo.id;
}

beforeEach(() => {
  snap = kernel.getState();
  // Mock Date.now to return unique values
  let now = 1000000000000;
  vi.spyOn(Date, "now").mockImplementation(() => ++now);
  return () => {
    kernel.setState(() => snap);
    vi.restoreAllMocks();
  };
});

// ═══════════════════════════════════════════════════════════════════
// 1. CRUD
// ═══════════════════════════════════════════════════════════════════

describe("CRUD", () => {
  test("AddTodo creates item in current category", () => {
    const before = selectVisibleTodos(state()).length;

    d(SyncDraft({ text: "Buy milk" }));
    d(AddTodo({}));

    const after = selectVisibleTodos(state());
    expect(after.length).toBe(before + 1);
    expect(after.some((t) => t.text === "Buy milk")).toBe(true);
    expect(state().ui.draft).toBe("");
  });

  test("AddTodo with explicit text (no draft)", () => {
    d(AddTodo({ text: "Explicit text" }));

    const todos = selectVisibleTodos(state());
    expect(todos.some((t) => t.text === "Explicit text")).toBe(true);
  });

  test("AddTodo with empty text → no-op", () => {
    const before = selectVisibleTodos(state()).length;

    d(SyncDraft({ text: "" }));
    d(AddTodo({}));

    expect(selectVisibleTodos(state()).length).toBe(before);
  });

  test("DeleteTodo removes item", () => {
    d(AddTodo({ text: "Delete me" }));
    const target = selectVisibleTodos(state()).find(
      (t) => t.text === "Delete me",
    )!;

    d(DeleteTodo({ id: target.id }));

    expect(
      selectVisibleTodos(state()).some((t) => t.text === "Delete me"),
    ).toBe(false);
  });

  test("ToggleTodo flips completed", () => {
    d(AddTodo({ text: "Toggle me" }));
    const id = selectVisibleTodos(state()).find(
      (t) => t.text === "Toggle me",
    )!.id;

    d(ToggleTodo({ id }));
    expect(state().data.todos[id]!.completed).toBe(true);

    d(ToggleTodo({ id }));
    expect(state().data.todos[id]!.completed).toBe(false);
  });

  test("ClearCompleted removes only completed", () => {
    const keepId = addTodo("Keep");
    const clearId = addTodo("Clear");
    d(ToggleTodo({ id: clearId }));

    d(ClearCompleted());

    expect(state().data.todos[keepId]).toBeDefined();
    expect(state().data.todos[clearId]).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Editing Flow
// ═══════════════════════════════════════════════════════════════════

describe("Editing", () => {
  test("Start → SyncEditDraft → Save", () => {
    d(AddTodo({ text: "Original" }));
    const id = selectVisibleTodos(state()).find(
      (t) => t.text === "Original",
    )!.id;

    d(StartEdit({ id }));
    expect(state().ui.editingId).toBe(id);
    expect(state().ui.editDraft).toBe("Original");

    d(SyncEditDraft({ text: "Modified" }));
    expect(state().ui.editDraft).toBe("Modified");

    d(UpdateTodoText({ text: "Modified" }));
    expect(state().data.todos[id]!.text).toBe("Modified");
    expect(state().ui.editingId).toBeNull();
  });

  test("Cancel preserves original", () => {
    d(AddTodo({ text: "Keep Me" }));
    const id = selectVisibleTodos(state()).find(
      (t) => t.text === "Keep Me",
    )!.id;

    d(StartEdit({ id }));
    d(SyncEditDraft({ text: "Changed" }));
    d(CancelEdit());

    expect(state().data.todos[id]!.text).toBe("Keep Me");
    expect(state().ui.editingId).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Selectors
// ═══════════════════════════════════════════════════════════════════

describe("Selectors", () => {
  test("selectVisibleTodos filters by category", () => {
    d(SelectCategory({ id: "cat_work" }));
    const workTodos = selectVisibleTodos(state());
    expect(workTodos.every((t) => t.categoryId === "cat_work")).toBe(true);

    d(SelectCategory({ id: "cat_inbox" }));
    const inboxTodos = selectVisibleTodos(state());
    expect(inboxTodos.every((t) => t.categoryId === "cat_inbox")).toBe(true);
  });

  test("selectCategories preserves order", () => {
    const categories = selectCategories(state());
    expect(categories.length).toBeGreaterThanOrEqual(3);
    expect(categories[0]!.text).toBe("Inbox");
  });

  test("selectStats counts correctly", () => {
    d(SelectCategory({ id: "cat_inbox" }));
    d(AddTodo({ text: "Active 1" }));
    d(AddTodo({ text: "Done 1" }));
    const doneId = selectVisibleTodos(state()).find(
      (t) => t.text === "Done 1",
    )!.id;
    d(ToggleTodo({ id: doneId }));

    const stats = selectStats(state());
    expect(stats.completed).toBeGreaterThanOrEqual(1);
    expect(stats.active).toBeGreaterThanOrEqual(1);
    expect(stats.total).toBe(stats.completed + stats.active);
  });

  test("selectEditingTodo returns editing item", () => {
    d(AddTodo({ text: "Edit Target" }));
    const id = selectVisibleTodos(state()).find(
      (t) => t.text === "Edit Target",
    )!.id;

    expect(selectEditingTodo(state())).toBeNull();

    d(StartEdit({ id }));
    const editing = selectEditingTodo(state());
    expect(editing).not.toBeNull();
    expect(editing!.text).toBe("Edit Target");
  });

  test("selectTodosByCategory groups correctly", () => {
    const grouped = selectTodosByCategory(state());
    expect(grouped).toBeInstanceOf(Map);

    const categories = selectCategories(state());
    for (const cat of categories) {
      expect(grouped.has(cat.id)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. Ordering
// ═══════════════════════════════════════════════════════════════════

describe("Ordering", () => {
  test("MoveItemUp swaps positions", () => {
    const firstId = addTodo("First");
    const secondId = addTodo("Second");

    const beforeIds = selectVisibleTodos(state()).map((t) => t.id);
    const firstBefore = beforeIds.indexOf(firstId);
    const secondBefore = beforeIds.indexOf(secondId);
    expect(secondBefore).toBeGreaterThan(firstBefore);

    d(MoveItemUp({ focusId: secondId }));

    const afterIds = selectVisibleTodos(state()).map((t) => t.id);
    expect(afterIds.indexOf(secondId)).toBeLessThan(afterIds.indexOf(firstId));
  });

  test("MoveItemUp at top does nothing", () => {
    const beforeOrder = selectVisibleTodos(state()).map((t) => t.id);
    const topId = beforeOrder[0]!;

    d(MoveItemUp({ focusId: topId }));

    const afterOrder = selectVisibleTodos(state()).map((t) => t.id);
    expect(afterOrder).toEqual(beforeOrder);
  });

  test("MoveItemDown swaps positions", () => {
    const aId = addTodo("A");
    const bId = addTodo("B");

    d(MoveItemDown({ focusId: aId }));

    const afterIds = selectVisibleTodos(state()).map((t) => t.id);
    expect(afterIds.indexOf(aId)).toBeGreaterThan(afterIds.indexOf(bId));
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. Category
// ═══════════════════════════════════════════════════════════════════

describe("Category", () => {
  test("SelectCategory changes selectedCategoryId", () => {
    d(SelectCategory({ id: "cat_work" }));
    expect(state().ui.selectedCategoryId).toBe("cat_work");

    d(SelectCategory({ id: "cat_inbox" }));
    expect(state().ui.selectedCategoryId).toBe("cat_inbox");
  });

  test("MoveCategoryUp/Down reorders", () => {
    d(SelectCategory({ id: "cat_work" }));
    const beforeOrder = [...state().data.categoryOrder];

    d(MoveCategoryUp());

    const afterOrder = [...state().data.categoryOrder];
    const workIdxBefore = beforeOrder.indexOf("cat_work");
    const workIdxAfter = afterOrder.indexOf("cat_work");
    expect(workIdxAfter).toBeLessThan(workIdxBefore);

    d(MoveCategoryDown());
    const restored = [...state().data.categoryOrder];
    expect(restored).toEqual(beforeOrder);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. Clipboard
// ═══════════════════════════════════════════════════════════════════

describe("Clipboard", () => {
  test("DuplicateTodo creates copy", () => {
    d(AddTodo({ text: "Original" }));
    const originalId = selectVisibleTodos(state()).find(
      (t) => t.text === "Original",
    )!.id;

    d(DuplicateTodo({ id: originalId }));

    const copies = selectVisibleTodos(state()).filter(
      (t) => t.text === "Original",
    );
    expect(copies.length).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. View
// ═══════════════════════════════════════════════════════════════════

describe("View", () => {
  test("ToggleView switches list ↔ board", () => {
    const initial = state().ui.viewMode;
    d(ToggleView());
    const toggled = state().ui.viewMode;
    expect(toggled).not.toBe(initial);

    d(ToggleView());
    expect(state().ui.viewMode).toBe(initial);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. Undo / Redo
// ═══════════════════════════════════════════════════════════════════

describe("Undo/Redo", () => {
  test.todo("Undo reverses delete (requires history middleware)");
  test.todo("Redo re-applies after undo (requires history middleware)");
});

// ═══════════════════════════════════════════════════════════════════
// 9. Draft
// ═══════════════════════════════════════════════════════════════════

describe("Draft", () => {
  test("SyncDraft updates state", () => {
    d(SyncDraft({ text: "Hello" }));
    expect(state().ui.draft).toBe("Hello");

    d(SyncDraft({ text: "" }));
    expect(state().ui.draft).toBe("");
  });
});
