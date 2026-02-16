export type AppEffect =
  | { type: "FOCUS_ID"; id: string | number }
  | {
      type: "NAVIGATE";
      direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
      targetZone?: string;
    }
  | { type: "SCROLL_INTO_VIEW"; id: string | number };

type FocusTarget = "DRAFT" | string | null;

export interface Category {
  id: string;
  text: string;
}
export interface Todo {
  id: string;
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
  timestamp: number;
  // Snapshot state for undo/redo (optional if just logging)
  snapshot?: any;
  // Legacy support
  resultingState?: any;
  groupId?: string; // For transaction support
  focusedItemId?: string | number; // For restoring focus on undo/redo
}

export interface DataState {
  // Entities
  categories: Record<string, Category>;
  todos: Record<string, Todo>;

  // Ordering
  categoryOrder: string[];
  todoOrder: string[];
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
  clipboard: { todos: Todo[]; isCut: boolean } | null;
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
