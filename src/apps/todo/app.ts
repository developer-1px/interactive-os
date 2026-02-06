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
            key: "todo-app-v5",
            debounceMs: 250,
        },
    },
    keymap: TODO_KEYMAP,
    middleware: [navigationMiddleware, historyMiddleware],
    contextMap: (state, env) =>
        mapStateToContext(state, env.activeGroupId, env.focusPath, env.focusedItemId),
});
