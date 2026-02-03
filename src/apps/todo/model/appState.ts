export type AppEffect =
    | { type: "FOCUS_ID"; id: string | number }
    | {
        type: "NAVIGATE";
        direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
        targetZone?: string;
    }
    | { type: "SCROLL_INTO_VIEW"; id: string | number };

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

// Decoupled Command Type for History to avoid Cycle
export interface GenericCommand {
    type: string;
    payload?: any;
}

export interface HistoryEntry {
    command: GenericCommand; // Was TodoCommand
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
    // focusRequest removed in favor of state.effects
    draft: string;
    editingId: FocusTarget;
    editDraft: string;
    viewMode: "list" | "board";
    isInspectorOpen: boolean;
}

export interface HistoryState {
    past: HistoryEntry[];
    future: HistoryEntry[];
}

export interface AppState {
    data: DataState;
    ui: UIState;
    effects: AppEffect[]; // [NEW] FIFO Queue for Side Effects
    history: HistoryState;
}
