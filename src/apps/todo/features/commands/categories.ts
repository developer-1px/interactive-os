import { produce } from "immer";
import { defineCommand } from "@apps/todo/features/commands/factory";

export const MoveCategoryUp = defineCommand({
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

export const MoveCategoryDown = defineCommand({
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

export const SelectCategory = defineCommand({
    id: "SELECT_CATEGORY",

    run: (state, payload: { id?: string } = {}) => {
        const id = payload?.id;
        // Requires explicit payload now
        return !id || typeof id !== "string"
            ? state
            : { ...state, ui: { ...state.ui, selectedCategoryId: id } };
    },
});

export const JumpToList = defineCommand({
    id: "JUMP_TO_LIST",

    run: (state) => ({
        ...state,
        effects: [...state.effects, { type: "FOCUS_ID", id: "DRAFT" }],
    }),
});

export const MoveSidebarFocusUp = defineCommand({
    id: "MOVE_SIDEBAR_FOCUS_UP",
    run: (state) => {
        return {
            ...state,
            effects: [...state.effects, { type: "NAVIGATE", direction: "UP" }],
        };
    },
});

export const MoveSidebarFocusDown = defineCommand({
    id: "MOVE_SIDEBAR_FOCUS_DOWN",
    run: (state) => ({
        ...state,
        effects: [...state.effects, { type: "NAVIGATE", direction: "DOWN" }],
    }),
});
