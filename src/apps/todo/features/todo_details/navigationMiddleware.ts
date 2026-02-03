import { produce } from "immer";
import type { AppState, TodoCommand, HistoryEntry, AppEffect } from "@apps/todo/model/types";
import { useFocusStore } from "@os/core/focus";
import { ensureFocusIntegrity } from "@apps/todo/logic/focus_rules";
import { saveState } from "@apps/todo/features/todo_details/persistence";
import { focusRegistry } from "@apps/todo/logic/focusStrategies";
import { mapStateToContext } from "@apps/todo/bridge/contextMapper";
import { OS_COMMANDS } from "@os/core/command/osCommands";

// Helper to create snapshot
const createSnapshot = (s: AppState, cmd: TodoCommand): HistoryEntry => ({
  command: cmd,
  resultingState: {
    todos: s.data.todos,
    todoOrder: s.data.todoOrder,
    draft: s.ui.draft,
  },
});

export const navigationMiddleware = (
  rawNewState: AppState,
  action: TodoCommand,
  prevState: AppState,
): AppState => {
  // 1. Effect Processing Pipeline
  // We consume the effect queue here.
  const effects = [...(rawNewState.effects || [])];

  // Bridge OS Commands to Effects
  const osEffect = resolveNavigation(action);
  if (osEffect) effects.push(osEffect);

  if (effects.length > 0) {
    const focusStore = useFocusStore.getState();
    const activeZoneId = focusStore.activeZoneId;
    const currentFocus = focusStore.focusedItemId;
    const zoneData = activeZoneId ? focusStore.zoneRegistry[activeZoneId] : null;

    effects.forEach((effect: AppEffect) => {
      // --- EFFECT: SET FOCUS DIRECTLY ---
      if (effect.type === "FOCUS_ID") {
        if (effect.id !== null) {
          useFocusStore.getState().setFocus(String(effect.id));
        }
      }
      // --- EFFECT: NAVIGATION ---
      // Removed: Navigation is now handled by the OS Command Registry directly 
      // in osRegistry.ts to avoid double-execution and unify at the command layer.
    });

    // CRITICAL: Consume the effects!
    // We empty the queue so effects don't persist in history or re-trigger.
    // However, since `rawNewState` is immutable freeze from Immer (if strict), we might need `produce` or assume this is the result of a producer?
    // Wait, the middleware signature in `createCommandStore` allows `onStateChange` to return a NEW state.
    // It receives `currentState` (which is `rawNewState` returned from reducer).
    // So we must return a modified state with effects cleared.
  }

  // 2. Data Integrity Checks
  const healedState = ensureFocusIntegrity(rawNewState, prevState);

  // 3. Clear Effects (Validation of Consumption)
  if (healedState.effects && healedState.effects.length > 0) {
    // Return a new object with effects cleared.
    // We can use produce here or spread since it's just one field.
    // But we are in middleware, better to be safe.
    return produce(healedState, (draft) => {
      draft.effects = [];
    });
  }

  saveState(healedState);

  // Universal Undo Logic with Immer (Same as before)
  if (action.type === "UNDO" || action.type === OS_COMMANDS.UNDO) {
    return produce(prevState, (draft) => {
      const past = draft.history.past;
      if (past.length === 0) return;

      const popEntry = () => past.pop();
      const entry = popEntry();
      if (!entry) return;

      const targetGroupId = entry.groupId;
      let entryToRestore = entry;

      if (targetGroupId) {
        while (
          past.length > 0 &&
          past[past.length - 1].groupId === targetGroupId
        ) {
          entryToRestore = past.pop()!;
        }
      }

      // Push to Future
      const currentSnapshot = createSnapshot(prevState, action);
      draft.history.future.unshift(currentSnapshot);

      // Restore State
      draft.data.todos = entryToRestore.resultingState.todos;
      draft.data.todoOrder = entryToRestore.resultingState.todoOrder;
      draft.ui.draft = entryToRestore.resultingState.draft;
    });
  }

  // Universal Redo Logic with Immer
  if (action.type === "REDO" || action.type === OS_COMMANDS.REDO) {
    return produce(prevState, (draft) => {
      const future = draft.history.future;
      if (future.length === 0) return;

      const nextEntry = future.shift(); // Pop from front
      if (!nextEntry) return;

      // Push current to Past
      const currentSnapshot = createSnapshot(prevState, action);
      draft.history.past.push(currentSnapshot);

      // Restore State
      draft.data.todos = nextEntry.resultingState.todos;
      draft.data.todoOrder = nextEntry.resultingState.todoOrder;
      draft.ui.draft = nextEntry.resultingState.draft;
    });
  }

  // History Recording
  return produce(healedState, (draft) => {
    // Clear effects again just to be sure if we didn't hit the block above? 
    // No, we handled it. But let's ensure draft.effects is empty.
    draft.effects = [];

    const snapshot = createSnapshot(prevState, action);
    if (action.payload && (action.payload as any).groupId) {
      snapshot.groupId = (action.payload as any).groupId;
    }

    draft.history.past.push(snapshot);
    if (draft.history.past.length > 50) draft.history.past.shift();
    draft.history.future = [];
  });
};

/**
 * Handle OS Navigation effects from action
 */
function resolveNavigation(action: TodoCommand): AppEffect | null {
  if (action.type === OS_COMMANDS.NAVIGATE) {
    return {
      type: "NAVIGATE",
      direction: (action.payload as any).direction,
    };
  }
  return null;
}
