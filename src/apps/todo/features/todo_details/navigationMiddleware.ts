import { produce } from "immer";
import type { AppState, TodoCommand } from "@apps/todo/model/types";
import { DOMInterface } from "@os/features/focusZone/registry/DOMInterface";
import { GlobalZoneRegistry } from "@os/features/focusZone/registry/GlobalZoneRegistry";


export const navigationMiddleware = (
  rawNewState: AppState,
  _action: TodoCommand,
  prevState: AppState,
): AppState => {
  const effects = [...(rawNewState.effects || [])];

  // --- UNIFIED FOCUS HANDLING ---
  // Priority: FOCUS_ID effect > Recovery (if focused item was deleted)

  const focusEffect = effects.find(
    (e): e is { type: "FOCUS_ID"; id: string | number } => e.type === "FOCUS_ID"
  );

  if (focusEffect && focusEffect.id !== null) {
    // 1. Explicit focus request via FOCUS_ID effect
    // Defer until after React render so new items are registered
    requestAnimationFrame(() => {
      // [NEW] Set focus via Global Registry -> Active Zone
      const activeStore = GlobalZoneRegistry.getActiveZone();
      if (activeStore) {
        activeStore.getState().setFocus(String(focusEffect.id));
      }
    });
  } else {
    // 2. No explicit focus request - check if recovery is needed
    // Recovery applies when the previously focused item no longer exists

    // [NEW] Get Active Zone and Focus
    const activeStore = GlobalZoneRegistry.getActiveZone();
    if (!activeStore) return rawNewState; // Can't do anything if no active zone

    const focusedItemId = activeStore.getState().focusedItemId;

    if (focusedItemId) {
      // Find which zone had this item
      const prevTodoIds = Object.keys(prevState.data.todos).map(Number);
      const newTodoIds = Object.keys(rawNewState.data.todos).map(Number);

      const wasItemDeleted =
        prevTodoIds.includes(Number(focusedItemId)) &&
        !newTodoIds.includes(Number(focusedItemId));

      if (wasItemDeleted) {
        // Item was deleted - apply recovery
        // Simple Recovery Strategy: "Steer" to next logical item
        const visualItems = prevState.data.todoOrder.map(String);

        // Find index of deleted item
        const deletedIndex = visualItems.indexOf(focusedItemId);
        let targetId: string | null = null;

        if (deletedIndex !== -1) {
          // Try next
          if (deletedIndex < visualItems.length - 1) {
            targetId = visualItems[deletedIndex + 1];
          }
          // Try prev
          else if (deletedIndex > 0) {
            targetId = visualItems[deletedIndex - 1];
          }
        }

        // Verify target exists in new state? 
        // Ideally yes, but here we assume single deletion. 
        // If targetId is also deleted, this might fail, but acceptable for now.

        if (targetId) {
          requestAnimationFrame(() => {
            // [NEW] Use local store instance
            activeStore.getState().setFocus(targetId!);
            const el = DOMInterface.getItem(targetId!);
            el?.focus();
          });
        }
      }
    }
  }

  // Clear effects
  let nextState = rawNewState;
  if (rawNewState.effects && rawNewState.effects.length > 0) {
    nextState = produce(rawNewState, (draft) => {
      draft.effects = [];
    });
  }

  return nextState;
};
