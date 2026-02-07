import { defineApplication } from "@os/features/application/defineApplication";
import { INITIAL_STATE } from "@apps/kanban/features/persistence";
import { KANBAN_KEYMAP } from "@apps/kanban/features/kanbanKeys";
import { navigationMiddleware } from "@apps/kanban/middleware/navigationMiddleware";
import { historyMiddleware } from "@apps/kanban/middleware/historyMiddleware";
import { mapStateToContext } from "@apps/kanban/bridge/mapStateToContext";
import type { KanbanState, KanbanCommandId } from "@apps/kanban/model/types";

export const KanbanApp = defineApplication<KanbanState, KanbanCommandId>({
    id: "kanban",
    name: "Kanban",
    model: {
        initial: INITIAL_STATE,
        persistence: {
            key: "kanban-app-v1",
            debounceMs: 250,
        },
    },
    keymap: KANBAN_KEYMAP,
    middleware: [navigationMiddleware, historyMiddleware],
    contextMap: (state, env) =>
        mapStateToContext(state, env.activeGroupId, env.focusPath, env.focusedItemId),
});
