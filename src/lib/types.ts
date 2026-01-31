export type ZoneId = 'sidebar' | 'todoList';
export type FocusTarget = 'DRAFT' | number | string | null;

export interface Category { id: string; text: string; icon?: string }
export interface Todo { id: number; text: string; completed: boolean; categoryId: string }

export type CommandType =
    | 'PATCH' | 'ADD_TODO' | 'TOGGLE_TODO' | 'DELETE_TODO'
    | 'MOVE_FOCUS_UP' | 'MOVE_FOCUS_DOWN' | 'SET_FOCUS'
    | 'START_EDIT' | 'CANCEL_EDIT' | 'UPDATE_TODO_TEXT' | 'SYNC_EDIT_DRAFT'
    | 'MOVE_CATEGORY_UP' | 'MOVE_CATEGORY_DOWN' | 'SELECT_CATEGORY'
    | 'JUMP_TO_LIST' | 'JUMP_TO_SIDEBAR';

export type TodoCommand =
    | { type: 'PATCH'; payload: Partial<AppState> }
    | { type: 'ADD_TODO'; payload?: { id: number } }
    | { type: 'TOGGLE_TODO'; payload?: { id: number } }
    | { type: 'DELETE_TODO'; payload?: { id: number } }
    | { type: 'MOVE_FOCUS_UP'; payload?: { direction: 'UP' | 'DOWN' } }
    | { type: 'MOVE_FOCUS_DOWN'; payload?: { direction: 'UP' | 'DOWN' } }
    | { type: 'SET_FOCUS'; payload: { id: FocusTarget } }
    | { type: 'START_EDIT'; payload?: { id: number } }
    | { type: 'CANCEL_EDIT' }
    | { type: 'UPDATE_TODO_TEXT'; payload?: { id: number, text: string } }
    | { type: 'SYNC_EDIT_DRAFT'; payload: { text: string } }
    | { type: 'MOVE_CATEGORY_UP'; payload?: { direction: 'UP' | 'DOWN' } }
    | { type: 'MOVE_CATEGORY_DOWN'; payload?: { direction: 'UP' | 'DOWN' } }
    | { type: 'SELECT_CATEGORY'; payload?: { id: string } }
    | { type: 'JUMP_TO_LIST' }
    | { type: 'JUMP_TO_SIDEBAR' };

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
