import { mapStateToContext } from "@apps/kanban/bridge/mapStateToContext";
import { KANBAN_KEYMAP } from "@apps/kanban/features/kanbanKeys";
import { INITIAL_STATE } from "@apps/kanban/features/persistence";
import { historyMiddleware } from "@apps/kanban/middleware/historyMiddleware";
import { navigationMiddleware } from "@apps/kanban/middleware/navigationMiddleware";
import type { KanbanCommandId, KanbanState } from "@apps/kanban/model/types";
import { defineApplication } from "@os/features/application/defineApplication";

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
    mapStateToContext(
      state,
      env.activeGroupId,
      env.focusPath,
      env.focusedItemId,
    ),
});
