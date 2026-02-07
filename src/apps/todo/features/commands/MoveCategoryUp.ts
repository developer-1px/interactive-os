import { defineSidebarCommand } from "@apps/todo/features/commands/defineGlobalCommand";
import { produce } from "immer";

export const MoveCategoryUp = defineSidebarCommand({
  id: "MOVE_CATEGORY_UP",
  run: (state) =>
    produce(state, (draft) => {
      const id = state.ui.selectedCategoryId;
      const idx = draft.data.categoryOrder.indexOf(id);
      if (idx > 0) {
        const prev = draft.data.categoryOrder[idx - 1];
        draft.data.categoryOrder[idx - 1] = id;
        draft.data.categoryOrder[idx] = prev;
      }
    }),
});

export const MoveCategoryDown = defineSidebarCommand({
  id: "MOVE_CATEGORY_DOWN",
  run: (state) =>
    produce(state, (draft) => {
      const id = state.ui.selectedCategoryId;
      const idx = draft.data.categoryOrder.indexOf(id);
      if (idx !== -1 && idx < draft.data.categoryOrder.length - 1) {
        const next = draft.data.categoryOrder[idx + 1];
        draft.data.categoryOrder[idx + 1] = id;
        draft.data.categoryOrder[idx] = next;
      }
    }),
});

export const SelectCategory = defineSidebarCommand({
  id: "SELECT_CATEGORY",

  run: (state, payload: { id?: string } = {}) => {
    const id = payload?.id;
    // Requires explicit payload now
    return !id || typeof id !== "string"
      ? state
      : { ...state, ui: { ...state.ui, selectedCategoryId: id } };
  },
});
