export interface TodoContext {
    // Physics / Dimensions
    focusIndex: number;
    listLength: number;
    maxIndex: number;

    // State Flags
    hasDraft: boolean;
    isOrdering: boolean; // e.g. dragging or special mode? (Maybe not needed yet)

    // Environment
    activeZone: 'sidebar' | 'listView' | 'boardView' | null;
    isEditing: boolean;
    isDraftFocused: boolean;
    isFieldFocused: boolean;
    cursorAtStart?: boolean; // Extrinsic

    // Data Stats
    hasCategories: boolean;
    hasTodos: boolean;

    // Selection
    selectedCategoryId: string;

    // View State
    viewMode: 'list' | 'board';
    isFirstColumn?: boolean;
    isLastColumn?: boolean;
}
