import type { ContextState } from "@os/core/context";

// Ideally types for AppState would be imported here, but we use any for decoupling or import from model
// import type { AppState } from "../model/types"; 

/**
 * Standard mapper to convert AppState to ContextState.
 * This centralizes the logic currently found in TodoEngine hook.
 */
export function mapStateToContext(state: any): ContextState {
    if (!state || !state.ui) return {};

    const { ui } = state;
    const currentZone = ui.activeZone || "todoList"; // Default fallback

    return {
        activeZone: currentZone,
        selectedCategoryId: ui.selectedCategoryId,
        isEditing: !!ui.editingId, // Fixed based on UIState
        viewMode: ui.viewMode,
    };
}
