/**
 * OS History Middleware (Built-in)
 *
 * Automatically records undo/redo snapshots for any app state
 * that has a `history` field conforming to HistoryState.
 *
 * Features:
 * - Captures focusedItemId for focus restoration on undo
 * - Auto-filters OS passthrough commands (no-op in app state)
 * - Detects `log: false` commands via action._def
 * - data-change detection: only records when state.data changed
 */

import { OS_COMMANDS } from "@/os-new/schema/command/OSCommands";
import type { Middleware } from "@os/features/command/model/createCommandStore";
import { FocusData } from "@os/features/focus/lib/focusData";
import { produce } from "immer";
import type { HistoryEntry } from "./types";

const HISTORY_LIMIT = 50;

// OS commands that are no-op passthrough — never record
const OS_PASSTHROUGH: Set<string> = new Set([
  OS_COMMANDS.NAVIGATE,
  OS_COMMANDS.FOCUS,
  OS_COMMANDS.SELECT,
  OS_COMMANDS.SELECT_ALL,
  OS_COMMANDS.DESELECT_ALL,
  OS_COMMANDS.TAB,
  OS_COMMANDS.TAB_PREV,
  OS_COMMANDS.ACTIVATE,
  OS_COMMANDS.ESCAPE,
  OS_COMMANDS.RECOVER,
  OS_COMMANDS.TOGGLE_INSPECTOR,
  OS_COMMANDS.COPY,
  OS_COMMANDS.CUT,
  OS_COMMANDS.PASTE,
  OS_COMMANDS.TOGGLE,
  OS_COMMANDS.DELETE,
  OS_COMMANDS.UNDO,
  OS_COMMANDS.REDO,
]);

// App-level commands that manage history themselves
const HISTORY_SELF_MANAGED = new Set(["UNDO", "REDO"]);

export const historyMiddleware: Middleware<any, any> =
  (next) => (state, action) => {
    // Capture focus BEFORE command execution (so we get the pre-command focus)
    const activeZone = FocusData.getActiveZone();
    const previousFocusId = activeZone?.store?.getState().focusedItemId ?? null;

    // Execute command (POST middleware)
    const nextState = next(state, action);
    const prevState = state;

    // No history field = app doesn't use undo/redo
    if (!nextState.history && !prevState.history) return nextState;

    // Skip OS passthrough commands
    if (OS_PASSTHROUGH.has(action.type)) return nextState;

    // Skip self-managed history commands
    if (HISTORY_SELF_MANAGED.has(action.type)) return nextState;

    // Skip commands with log: false (SYNC_DRAFT, SYNC_EDIT_DRAFT, etc.)
    if (action._def?.log === false) return nextState;

    // Skip if data hasn't changed (pure UI state changes don't warrant undo)
    if (prevState.data !== undefined && prevState.data === nextState.data) {
      return nextState;
    }

    return produce(nextState, (draft: any) => {
      if (!draft.history) {
        draft.history = { past: [], future: [] };
      }

      const entry: HistoryEntry = {
        command: { type: action.type, payload: action.payload },
        timestamp: Date.now(),
        snapshot: (({ history, ...rest }: any) => rest)(prevState),
        focusedItemId: previousFocusId,
      };

      draft.history.past.push(entry);

      if (draft.history.past.length > HISTORY_LIMIT) {
        draft.history.past.shift();
      }

      // New action branch → clear redo future
      draft.history.future = [];
    });
  };
