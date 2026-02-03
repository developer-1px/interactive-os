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
    focusPath?: string[]
): ContextState {
    if (!state || !state.ui) return {};

    const { ui } = state;
    const currentZone = activeZoneId || ui.activeZone || "todoList";

    return {
        activeZone: currentZone,
        focusPath: focusPath || [currentZone], // Expose Path to Evaluation Context
        selectedCategoryId: ui.selectedCategoryId,
        isEditing: !!ui.editingId, // Fixed based on UIState
        viewMode: ui.viewMode,
    };
}
