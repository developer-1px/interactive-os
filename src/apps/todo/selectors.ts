/**
 * Todo Selectors — Pure derive functions for Todo state.
 *
 * All selectors are pure functions: AppState → derived value.
 * Consumed by View via `todoSlice.useComputed(selector)`.
 * Testable without DOM or React.
 */

import type { AppState, Category, Todo } from "@apps/todo/model/appState";

// ═══════════════════════════════════════════════════════════════════
// Todo Selectors
// ═══════════════════════════════════════════════════════════════════

/** Todos visible in the currently selected category, preserving todoOrder.
 *  When searchQuery is non-empty, further filters by text match (case-insensitive). */
export function selectVisibleTodos(state: AppState): Todo[] {
  const { selectedCategoryId, searchQuery } = state.ui;
  const q = searchQuery.trim().toLowerCase();
  return state.data.todoOrder
    .map((id) => state.data.todos[id])
    .filter(
      (todo): todo is Todo =>
        todo !== undefined &&
        todo.categoryId === selectedCategoryId &&
        (q === "" || todo.text.toLowerCase().includes(q)),
    );
}

/** IDs of visible todos in the currently selected category.
 *  When searchQuery is non-empty, further filters by text match (case-insensitive). */
export function selectVisibleTodoIds(state: AppState): string[] {
  const { selectedCategoryId, searchQuery } = state.ui;
  const q = searchQuery.trim().toLowerCase();
  return state.data.todoOrder.filter((id) => {
    const todo = state.data.todos[id];
    return (
      todo?.categoryId === selectedCategoryId &&
      (q === "" || todo.text.toLowerCase().includes(q))
    );
  });
}

/** All categories in display order. */
export function selectCategories(state: AppState): Category[] {
  return state.data.categoryOrder
    .map((id) => state.data.categories[id])
    .filter((cat): cat is Category => cat !== undefined);
}

/** Aggregate statistics for the selected category. */
export function selectStats(state: AppState): {
  total: number;
  completed: number;
  active: number;
} {
  const visible = selectVisibleTodos(state);
  const completed = visible.filter((t) => t.completed).length;
  return {
    total: visible.length,
    completed,
    active: visible.length - completed,
  };
}

/** The todo currently being edited, or null. */
export function selectEditingTodo(state: AppState): Todo | null {
  if (!state.ui.editingId) return null;
  const id = String(state.ui.editingId);
  return state.data.todos[id] ?? null;
}

/** Todos grouped by category — for board view. */
export function selectTodosByCategory(state: AppState): Map<string, Todo[]> {
  const grouped = new Map<string, Todo[]>();

  for (const catId of state.data.categoryOrder) {
    grouped.set(catId, []);
  }

  for (const todoId of state.data.todoOrder) {
    const todo = state.data.todos[todoId];
    if (!todo) continue;
    const list = grouped.get(todo.categoryId);
    if (list) {
      list.push(todo);
    } else {
      grouped.set(todo.categoryId, [todo]);
    }
  }

  return grouped;
}
