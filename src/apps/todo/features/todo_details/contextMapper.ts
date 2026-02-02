import type { AppState } from "@apps/todo/model/types";
import type { TodoContext } from "@apps/todo/logic/schema";

export const mapStateToContext = (
  state: AppState,
  focusedItemId: string | null,
  activeZoneId: string | null,
): TodoContext & Record<string, any> => {
  const { ui, data } = state;
  const focusId = focusedItemId;

  const isSidebar = activeZoneId === "sidebar";
  const isTodo = !isNaN(Number(focusId)); // Check if focusId is a number string
  const isDraft = focusId === "DRAFT" || focusId === "draft";

  // Calculate Physics using Normalized Data
  let focusIndex = -1;
  let listLength = 0;

  if (isSidebar) {
    focusIndex = data.categoryOrder.indexOf(focusId as string);
    listLength = data.categoryOrder.length;
  } else {
    // Derived View: Todo List for selected category
    const visibleIds = data.todoOrder.filter(
      (id) => data.todos[id].categoryId === ui.selectedCategoryId,
    );
    listLength = visibleIds.length;
    if (isTodo) {
      focusIndex = visibleIds.indexOf(Number(focusId));
    }
  }

  return {
    // Physics
    focusIndex,
    listLength,
    maxIndex: listLength > 0 ? listLength - 1 : 0,

    // State Flags
    hasDraft: !!ui.draft,
    isOrdering: false,

    // Environment
    // Use OS activeZoneId derived from subscription
    // We cast to any to satisfy the strict union type of TodoContext until we synchronize types
    activeZone: (activeZoneId as any) || "sidebar",
    isEditing: ui.editingId !== null,
    isDraftFocused: isDraft,
    isFieldFocused: isDraft || ui.editingId !== null,

    // Board Boundaries
    isFirstColumn: data.categoryOrder.indexOf(ui.selectedCategoryId) === 0,
    isLastColumn:
      data.categoryOrder.indexOf(ui.selectedCategoryId) ===
      data.categoryOrder.length - 1,

    // Data Stats
    hasCategories: data.categoryOrder.length > 0,
    hasTodos: data.todoOrder.length > 0,
    selectedCategoryId: ui.selectedCategoryId,

    // View State
    viewMode: ui.viewMode,
  };
};
