// --- Kanban Domain Entities ---

export interface KanbanBoard {
    id: string;
    title: string;
    description: string;
}

export interface KanbanColumn {
    id: string;
    title: string;
    color: string;
    wipLimit: number | null;
    collapsed: boolean;
}

export type Priority = "urgent" | "high" | "medium" | "low" | "none";

export interface KanbanLabel {
    id: string;
    name: string;
    color: string;
}

export interface KanbanCard {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    labels: string[]; // label IDs
    assignee: string | null;
    dueDate: string | null; // ISO date string
    columnId: string;
    createdAt: number;
}

// --- App State ---

export type AppEffect =
    | { type: "FOCUS_ID"; id: string | number }
    | { type: "SCROLL_INTO_VIEW"; id: string | number };

export interface GenericCommand {
    type: string;
    payload?: any;
}

export interface HistoryEntry {
    command: GenericCommand;
    timestamp: number;
    snapshot?: any;
}

export interface DataState {
    board: KanbanBoard;
    columns: Record<string, KanbanColumn>;
    columnOrder: string[];
    cards: Record<string, KanbanCard>;
    cardOrder: Record<string, string[]>; // columnId -> cardId[]
    labels: Record<string, KanbanLabel>;
}

export interface UIState {
    editingCardId: string | null;
    editDraft: string;
    drafts: Record<string, string>; // columnId -> draft text
    searchQuery: string;
    priorityFilter: Priority | null;
    labelFilter: string | null; // label ID
    editingColumnId: string | null;
    columnEditDraft: string;
    // Phase 1: Keyboard completion
    detailCardId: string | null;       // Card detail sheet
    actionMenuCardId: string | null;   // Action menu
    selectedCardIds: string[];          // Multi-selection
}

export interface HistoryState {
    past: HistoryEntry[];
    future: HistoryEntry[];
}

export interface KanbanState {
    data: DataState;
    ui: UIState;
    effects: AppEffect[];
    history: HistoryState;
}
