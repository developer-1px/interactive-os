import { defineApplication } from "@os/features/application/defineApplication";
import { INITIAL_STATE } from "@apps/todo/features/todo_details/persistence";

import { TODO_KEYMAP } from "@apps/todo/features/todoKeys";
import { navigationMiddleware } from "@apps/todo/features/todo_details/navigationMiddleware";
import { historyMiddleware } from "@apps/todo/middleware/historyMiddleware";
import { mapStateToContext } from "@apps/todo/bridge/mapStateToContext";
import type { AppState, TodoCommandId } from "@apps/todo/model/types";

export const TodoApp = defineApplication<AppState, TodoCommandId>({
    id: "todo",
    name: "Todo",
    model: {
        initial: INITIAL_STATE,
        persistence: {
            key: "todo-app-v5", // Upgraded to v5 for the new smarter-merge store
            debounceMs: 250,
        },
    },
    // commands: Removed (Zero-Config Discovery),
    keymap: TODO_KEYMAP,
    middleware: [navigationMiddleware, historyMiddleware],
    contextMap: (state, env) =>
        mapStateToContext(state, env.activeZoneId, env.focusPath, env.focusedItemId),
});
