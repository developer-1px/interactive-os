import { todoSlice } from "@apps/todo/app";
import type { AppState } from "@apps/todo/model/appState";
import { produce } from "immer";

export const MoveCategoryUp = todoSlice.group.defineCommand(
  "MOVE_CATEGORY_UP",
  [],
  (ctx: { state: AppState }) =>
    () => ({
      state: produce(ctx.state, (draft) => {
        const id = ctx.state.ui.selectedCategoryId;
        const idx = draft.data.categoryOrder.indexOf(id);
        if (idx > 0) {
          const prev = draft.data.categoryOrder[idx - 1]!;
          draft.data.categoryOrder[idx - 1] = id;
          draft.data.categoryOrder[idx] = prev;
        }
      }),
    }),
);

export const MoveCategoryDown = todoSlice.group.defineCommand(
  "MOVE_CATEGORY_DOWN",
  [],
  (ctx: { state: AppState }) =>
    () => ({
      state: produce(ctx.state, (draft) => {
        const id = ctx.state.ui.selectedCategoryId;
        const idx = draft.data.categoryOrder.indexOf(id);
        if (idx !== -1 && idx < draft.data.categoryOrder.length - 1) {
          const next = draft.data.categoryOrder[idx + 1]!;
          draft.data.categoryOrder[idx + 1] = id;
          draft.data.categoryOrder[idx] = next;
        }
      }),
    }),
);

export const SelectCategory = todoSlice.group.defineCommand(
  "SELECT_CATEGORY",
  [],
  (ctx: { state: AppState }) =>
    (payload: { id?: string }) => {
      const id = payload?.id;
      if (!id || typeof id !== "string") return { state: ctx.state };
      return {
        state: {
          ...ctx.state,
          ui: { ...ctx.state.ui, selectedCategoryId: id },
        },
      };
    },
);
