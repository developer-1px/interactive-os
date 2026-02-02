import { defineCommand } from "./factory";

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
