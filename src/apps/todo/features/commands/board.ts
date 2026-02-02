import { defineCommand } from "@apps/todo/features/commands/factory";

export const ToggleView = defineCommand({
    id: "TOGGLE_VIEW",
    run: (state) => ({
        ...state,
        ui: {
            ...state.ui,
            viewMode: state.ui.viewMode === "board" ? "list" : "board",
        },
    }),
});
