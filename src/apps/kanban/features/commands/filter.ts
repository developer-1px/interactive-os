import { defineKanbanCommand } from "@apps/kanban/features/commands/factory";
import type { Priority } from "@apps/kanban/model/appState";

export const SetSearchQuery = defineKanbanCommand({
    id: "KANBAN_SET_SEARCH",
    log: false,
    run: (state, payload: { query: string }) => ({
        ...state,
        ui: { ...state.ui, searchQuery: payload.query },
    }),
});

export const TogglePriorityFilter = defineKanbanCommand({
    id: "KANBAN_TOGGLE_PRIORITY_FILTER",
    run: (state, payload: { priority: Priority }) => ({
        ...state,
        ui: {
            ...state.ui,
            priorityFilter: state.ui.priorityFilter === payload.priority ? null : payload.priority,
        },
    }),
});

export const ToggleLabelFilter = defineKanbanCommand({
    id: "KANBAN_TOGGLE_LABEL_FILTER",
    run: (state, payload: { labelId: string }) => ({
        ...state,
        ui: {
            ...state.ui,
            labelFilter: state.ui.labelFilter === payload.labelId ? null : payload.labelId,
        },
    }),
});

export const ClearFilters = defineKanbanCommand({
    id: "KANBAN_CLEAR_FILTERS",
    run: (state) => ({
        ...state,
        ui: {
            ...state.ui,
            searchQuery: "",
            priorityFilter: null,
            labelFilter: null,
        },
    }),
});
