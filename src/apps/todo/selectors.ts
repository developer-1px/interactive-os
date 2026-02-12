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

/** Todos visible in the currently selected category, preserving todoOrder. */
export function selectVisibleTodos(state: AppState): Todo[] {
    const { selectedCategoryId } = state.ui;
    return state.data.todoOrder
        .map((id) => state.data.todos[id])
        .filter(
            (todo): todo is Todo =>
                todo !== undefined && todo.categoryId === selectedCategoryId,
        );
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
    const id =
        typeof state.ui.editingId === "number"
            ? state.ui.editingId
            : parseInt(state.ui.editingId as string, 10);
    return state.data.todos[id] ?? null;
}

/** Todos grouped by category — for board view. */
export function selectTodosByCategory(
    state: AppState,
): Map<string, Todo[]> {
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
