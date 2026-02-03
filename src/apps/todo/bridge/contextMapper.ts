import type { ContextState } from "@os/core/context";

// Ideally types for AppState would be imported here, but we use any for decoupling or import from model
// import type { AppState } from "../model/types"; 

/**
 * Standard mapper to convert AppState to ContextState.
 * This centralizes the logic currently found in TodoEngine hook.
 */
export function mapStateToContext(
    state: any,
    activeZoneId?: string | null,
    focusPath?: string[],
    focusedItemId?: string | null
): ContextState {
    if (!state || !state.ui) return {};

    const { ui, data } = state;
    const currentZone = activeZoneId || ui.activeZone || "todoList";

    // --- Index Calculation ---
    let focusIndex = -1;
    let maxIndex = -1;

    if (currentZone === "todoList" || currentZone === "listView") {
        focusIndex = data.todoOrder.indexOf(Number(focusedItemId));
        maxIndex = data.todoOrder.length - 1;
    } else if (currentZone === "sidebar") {
        focusIndex = data.categoryOrder.indexOf(focusedItemId);
        maxIndex = data.categoryOrder.length; // Max index is technically length of categories? No, logic usually uses maxIndex for checks.
        // Actually, if we have 3 categories, index 0, 1, 2. maxIndex = 2.
        maxIndex = data.categoryOrder.length - 1;
    }

    return {
        activeZone: currentZone,
        focusPath: focusPath || [currentZone], // Expose Path to Evaluation Context
        selectedCategoryId: ui.selectedCategoryId,
        isEditing: !!ui.editingId,
        viewMode: ui.viewMode,

        // --- NEW: Atomic logic properties ---
        isDraftFocused: focusedItemId === "todo-draft",
        hasDraft: ui.draft.length > 0,
        focusIndex,
        maxIndex,
    };
}
