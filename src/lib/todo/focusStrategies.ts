import type { AppState } from "../types";

export const listStrategy = (state: AppState) => {
  const catId = state.ui.selectedCategoryId;
  // We can't access focusId here anymore, but strategy usually finds *default* focus.
  const firstTodo = state.data.todoOrder.find(
    (id) => state.data.todos[id]?.categoryId === catId,
  );
  return firstTodo !== undefined ? String(firstTodo) : "DRAFT";
};

export const boardStrategy = (state: AppState) => {
  const catId = state.ui.selectedCategoryId;
  const firstTodo = state.data.todoOrder.find(
    (id) => state.data.todos[id]?.categoryId === catId,
  );
  // Fallback to Column Header if no todos
  return firstTodo !== undefined ? String(firstTodo) : `board_col_${catId}`;
};

export const sidebarStrategy = (state: AppState) => {
  return state.ui.selectedCategoryId;
};
