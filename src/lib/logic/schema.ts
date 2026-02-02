export interface TodoContext {
    // Physics / Dimensions
    focusIndex: number;
    listLength: number;
    maxIndex: number;

    // State Flags
    hasDraft: boolean;
    isOrdering: boolean; // e.g. dragging or special mode? (Maybe not needed yet)

    // Environment
    activeZone: 'sidebar' | 'todoList' | null;
    isEditing: boolean;
    isDraftFocused: boolean;
    isFieldFocused: boolean; // Added for strict typing

    // Data Stats
    hasCategories: boolean;
    hasTodos: boolean;

    // Selection
    selectedCategoryId: string;
}
