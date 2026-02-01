
export type FocusTarget = 'DRAFT' | number | string | null;

export interface Category { id: string; text: string; }
export interface Todo { id: number; text: string; completed: boolean; categoryId: string }

import type { InferredTodoCommand } from './todo_commands';
export type TodoCommand = InferredTodoCommand;
// Removed manual CommandType and TodoCommand unions in favor of Inference.

export interface HistoryEntry {
    command: TodoCommand;
    resultingState: { todos: Todo[]; draft: string; focusId: FocusTarget; };
}

export interface AppState {
    categories: Category[];
    selectedCategoryId: string;
    todos: Todo[];
    draft: string;
    focusId: FocusTarget;
    editingId: FocusTarget;
    editDraft: string;
    history: HistoryEntry[]
}
