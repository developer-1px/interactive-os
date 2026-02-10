import type { ContextState } from "@/os-new/core/logic/LogicNode";

export function mapStateToContext(
  state: any,
  activeGroupId?: string | null,
  focusPath?: string[],
  focusedItemId?: string | null,
): ContextState {
  if (!state || !state.ui) return {};

  const currentZone = activeGroupId || "kanban-board";

  return {
    activeZone: currentZone,
    focusPath: focusPath || [currentZone],
    isEditing: !!state.ui.editingCardId,
    isDraftFocused: focusedItemId?.startsWith("DRAFT-") ?? false,
    isSearchActive: !!state.ui.searchQuery,
    isDetailOpen: !!state.ui.detailCardId,
    isMenuOpen: !!state.ui.actionMenuCardId,
    hasSelection: (state.ui.selectedCardIds?.length || 0) > 0,
  };
}
