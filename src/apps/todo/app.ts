import { mapStateToContext } from "@apps/todo/bridge/mapStateToContext";
import { RedoCommand, UndoCommand } from "@apps/todo/features/commands/history";
import { INITIAL_STATE } from "@apps/todo/features/todo_details/persistence";
import { TODO_KEYMAP } from "@apps/todo/features/todoKeys";
import type { AppState, TodoCommandId } from "@apps/todo/model/types";
import { defineApplication } from "@os/features/application/defineApplication";

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
  commands: [UndoCommand, RedoCommand],
  keymap: TODO_KEYMAP,
  // middleware removed — OS provides navigation + history built-in
  contextMap: (state, env) =>
    mapStateToContext(
      state,
      env.activeGroupId,
      env.focusPath,
      env.focusedItemId,
    ),
});
