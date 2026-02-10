import type { ContextState } from "@/os-new/core/logic/LogicNode";

// Ideally types for AppState would be imported here, but we use any for decoupling or import from model
// import type { AppState } from "../model/types";

/**
 * Standard mapper to convert AppState to ContextState.
 * This centralizes the logic currently found in TodoEngine hook.
 */
export function mapStateToContext(
  state: any,
  activeGroupId?: string | null,
  focusPath?: string[],
  focusedItemId?: string | null,
): ContextState {
  if (!state || !state.ui) return {};

  const { ui } = state;
  const currentZone = activeGroupId || ui.activeZone || "todoList";

  return {
    activeZone: currentZone,
    focusPath: focusPath || [currentZone], // Expose Path to Evaluation Context
    isEditing: !!ui.editingId,

    // --- NEW: Atomic logic properties ---
    isDraftFocused: focusedItemId === "DRAFT",
  };
}
