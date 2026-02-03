import { defineGlobalCommand } from "@apps/todo/features/commands/factory";

export const ToggleView = defineGlobalCommand({
    id: "TOGGLE_VIEW",
    run: (state) => ({
        ...state,
        ui: {
            ...state.ui,
            viewMode: state.ui.viewMode === "board" ? "list" : "board",
        },
    }),
});
