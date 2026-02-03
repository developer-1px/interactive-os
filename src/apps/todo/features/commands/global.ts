import { defineCommand } from "@apps/todo/features/commands/factory";
import type { AppState } from "@apps/todo/model/appState";

export const Patch = defineCommand({
    id: "PATCH",
    run: (state, payload: Partial<AppState>) => ({ ...state, ...payload }),
});

export const SetFocus = defineCommand({
    id: "SET_FOCUS",
    run: (state, payload: { id: any }) => {
        // Auto-switch category if focusing a todo
        let nextCategory = state.ui.selectedCategoryId;
        if (typeof payload.id === "number") {
            const todo = state.data.todos[payload.id];
            if (todo) {
                nextCategory = todo.categoryId;
            }
        }
        // Also if focusing a category header directly (string id)
        if (typeof payload.id === "string" && state.data.categories[payload.id]) {
            nextCategory = payload.id;
        }

        return {
            ...state,
            ui: {
                ...state.ui,
                selectedCategoryId: nextCategory,
            },
            effects: [
                ...state.effects,
                { type: "FOCUS_ID", id: payload.id },
            ],
        };
    },
});

export const ToggleInspector = defineCommand({
    id: "TOGGLE_INSPECTOR",
    run: (state) => ({
        ...state,
        ui: {
            ...state.ui,
            isInspectorOpen: !state.ui.isInspectorOpen,
        },
    }),
});

export const Undo = defineCommand({
    id: "UNDO",
    run: (s) => s, // Handled by middleware
});

export const Redo = defineCommand({
    id: "REDO",
    run: (s) => s, // Handled by middleware
});
