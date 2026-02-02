import { produce } from "immer";
import type { AppState, TodoCommand, HistoryEntry, AppEffect } from "../types";
import { useFocusStore } from "../../stores/useFocusStore";
import { ensureFocusIntegrity } from "../logic/focus_rules";
import { saveState } from "./persistence";
import { focusRegistry } from "../logic/focusStrategies";
import { mapStateToContext } from "../context";

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
  const effects = rawNewState.effects || [];

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
      else if (effect.type === "NAVIGATE") {
        let targetId: string | null = null;

        // Navigation Logic (Strategies)
        // This relies on the current Active Zone to decide what "UP" means.

        // Helper: Strategy Resolver
        const resolveNavigation = (items: string[], currentId: string | null, delta: number, mode: "clamp" | "wrap" = "clamp"): string | null => {
          if (!items || items.length === 0) return null;
          let idx = -1;
          if (currentId) idx = items.indexOf(String(currentId));
          if (idx === -1) return items[0];

          const nextIdx = idx + delta;
          if (mode === "wrap") {
            return items[(nextIdx + items.length) % items.length];
          } else {
            if (nextIdx < 0 || nextIdx >= items.length) return null;
            return items[nextIdx];
          }
        };

        if (effect.direction === "UP" && zoneData?.items) {
          targetId = resolveNavigation(zoneData.items, currentFocus, -1, zoneData.navMode);
        } else if (effect.direction === "DOWN" && zoneData?.items) {
          targetId = resolveNavigation(zoneData.items, currentFocus, 1, zoneData.navMode);
        } else if (effect.direction === "LEFT") {
          // Zone Switching Logic (Simplified for now)
          if (activeZoneId?.startsWith("board_col_")) {
            const catId = activeZoneId.replace("board_col_", "");
            const order = rawNewState.data.categoryOrder;
            const idx = order.indexOf(catId);
            if (idx > 0) targetId = `board_col_${order[idx - 1]}`;
            else targetId = "sidebar";
          }
        } else if (effect.direction === "RIGHT") {
          if (activeZoneId === "sidebar" && rawNewState.ui.viewMode === "board") {
            const order = rawNewState.data.categoryOrder;
            if (order.length > 0) targetId = `board_col_${order[0]}`;
          } else if (activeZoneId?.startsWith("board_col_")) {
            const catId = activeZoneId.replace("board_col_", "");
            const order = rawNewState.data.categoryOrder;
            const idx = order.indexOf(catId);
            if (idx !== -1 && idx < order.length - 1) targetId = `board_col_${order[idx + 1]}`;
          }
        }

        // Execute Navigation Result
        if (targetId) {
          const isZone = targetId === "sidebar" || targetId === "listView" || targetId.startsWith("board_");
          if (isZone) {
            useFocusStore.getState().setActiveZone(targetId);
            // Resolve default focus for the zone
            const ctx = mapStateToContext(rawNewState) as unknown as import("../logic/schema").TodoContext;
            const targetFocusId = focusRegistry.resolve(targetId, rawNewState, ctx);
            if (targetFocusId) {
              useFocusStore.getState().setFocus(targetFocusId);
            }
          } else {
            useFocusStore.getState().setFocus(targetId);
          }
        }
      }
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
  if (action.type === "UNDO") {
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
  if (action.type === "REDO") {
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
