import type {
  HistoryEntry,
  KanbanCommand,
  KanbanState,
} from "@apps/kanban/model/types";
import { produce } from "immer";

const HISTORY_LIMIT = 50;

// Commands that should NOT be recorded in history
const SKIP_HISTORY = new Set([
  "KANBAN_UNDO",
  "KANBAN_REDO",
  "KANBAN_SYNC_DRAFT",
  "KANBAN_SYNC_EDIT_DRAFT",
  "KANBAN_SYNC_COLUMN_DRAFT",
  "KANBAN_SET_SEARCH",
  // OS-level navigation/focus commands
  "OS_NAVIGATE",
  "OS_FOCUS",
  "OS_TAB",
  "OS_TAB_PREV",
  "OS_SELECT",
  "OS_FIELD_SYNC",
]);

export const historyMiddleware = (
  nextState: KanbanState,
  action: KanbanCommand,
  prevState: KanbanState,
): KanbanState => {
  // Skip undo/redo and non-mutating commands
  if (SKIP_HISTORY.has(action.type)) {
    return nextState;
  }

  // Only record if data actually changed
  if (prevState.data === nextState.data) {
    return nextState;
  }

  return produce(nextState, (draft) => {
    if (!draft.history) {
      draft.history = { past: [], future: [] };
    }

    const entry: HistoryEntry = {
      command: action,
      timestamp: Date.now(),
      snapshot: {
        data: prevState.data,
        ui: prevState.ui,
        effects: [],
      },
    };

    draft.history.past.push(entry);

    if (draft.history.past.length > HISTORY_LIMIT) {
      draft.history.past.shift();
    }

    // Clear future on new action (standard undo behavior)
    draft.history.future = [];
  });
};
