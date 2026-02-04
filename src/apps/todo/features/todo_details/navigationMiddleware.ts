import { produce } from "immer";
import type { AppState, TodoCommand, AppEffect } from "@apps/todo/model/types";
import { useFocusStore } from "@os/features/focus/model/focusStore";
import { handlerRecovery } from "@os/features/focus/axes/handlerRecovery";
import { DEFAULT_RECOVERY_POLICY } from "@os/features/focus/model/recoveryTypes";
import { DOMInterface } from "@os/features/focus/lib/DOMInterface";


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
      useFocusStore.getState().setFocus(String(focusEffect.id));
    });
  } else {
    // 2. No explicit focus request - check if recovery is needed
    // Recovery applies when the previously focused item no longer exists
    const focusStore = useFocusStore.getState();
    const focusedItemId = focusStore.focusedItemId;

    if (focusedItemId) {
      // Find which zone had this item
      const prevTodoIds = Object.keys(prevState.data.todos).map(Number);
      const newTodoIds = Object.keys(rawNewState.data.todos).map(Number);

      const wasItemDeleted =
        prevTodoIds.includes(Number(focusedItemId)) &&
        !newTodoIds.includes(Number(focusedItemId));

      if (wasItemDeleted) {
        // Item was deleted - apply recovery
        const activeZoneId = focusStore.activeZoneId;
        const zone = focusStore.zoneRegistry[activeZoneId || ""];

        // [FIX] Use App State's todoOrder (visual order) instead of Zone's items (insertion order)
        // This ensures recovery jumps to the visual neighbor, not the chronological neighbor
        const visualItems = prevState.data.todoOrder.map(String);

        if (zone && visualItems.length > 0) {
          const direction = zone.behavior?.direction ?? "v";
          const result = handlerRecovery(
            focusedItemId,
            activeZoneId || "",
            visualItems,
            direction,
            DEFAULT_RECOVERY_POLICY
          );

          if (result.targetId) {
            requestAnimationFrame(() => {
              useFocusStore.getState().setFocus(result.targetId!);
              const el = DOMInterface.getItem(result.targetId!);
              el?.focus();
            });
          }
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
