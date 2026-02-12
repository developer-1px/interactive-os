import { todoSlice } from "@apps/todo/app";
import type { AppState } from "@apps/todo/model/appState";

export const ToggleView = todoSlice.group.defineCommand(
  "TOGGLE_VIEW",
  [],
  (ctx: { state: AppState }) => () => ({
    state: {
      ...ctx.state,
      ui: {
        ...ctx.state.ui,
        viewMode: ctx.state.ui.viewMode === "board" ? "list" : "board",
      },
    },
  }),
);
