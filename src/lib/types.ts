export type FocusTarget = "DRAFT" | number | string | null;

export interface Category {
  id: string;
  text: string;
}
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  categoryId: string;
}

import type { InferredTodoCommand } from "./todoCommands";
export type TodoCommand = InferredTodoCommand;
// Removed manual CommandType and TodoCommand unions in favor of Inference.

export interface HistoryEntry {
  command: TodoCommand;
  resultingState: {
    todos: Record<number, Todo>;
    todoOrder: number[];
    draft: string;
    // focusId: FocusTarget; // Moved to OS Layer
  };
  groupId?: string; // For transaction support
}

export interface DataState {
  // Entities
  categories: Record<string, Category>;
  todos: Record<number, Todo>;

  // Ordering
  categoryOrder: string[];
  todoOrder: number[];
}

export interface UIState {
  selectedCategoryId: string;
  // focusId: FocusTarget; // Moved to OS Layer (useFocusStore)
  focusRequest?: string; // Signals a request to the OS to change focus
  draft: string;
  editingId: FocusTarget;
  editDraft: string;
  viewMode: "list" | "board";
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

export interface AppState {
  data: DataState;
  ui: UIState;
  history: HistoryState;
}
