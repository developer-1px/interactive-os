import type { AppState, TodoCommand } from "@apps/todo/model/types";
import { FocusData } from "@os/features/focus/lib/focusData";
import { produce } from "immer";

export const navigationMiddleware = (
  rawNewState: AppState,
  _action: TodoCommand,
  _prevState: AppState,
): AppState => {
  const effects = [...(rawNewState.effects || [])];

  // --- FOCUS_ID Effect Handling ---
  const focusEffect = effects.find(
    (e): e is { type: "FOCUS_ID"; id: string | number } =>
      e.type === "FOCUS_ID",
  );

  if (focusEffect && focusEffect.id !== null) {
    const targetId = String(focusEffect.id);
    const activeGroupId = FocusData.getActiveZoneId();

    // Synchronous store + DOM update to prevent flicker
    if (activeGroupId) {
      const data = FocusData.getById(activeGroupId);
      if (data) {
        // Update store state immediately
        data.store.setState({ focusedItemId: targetId });

        // Focus DOM element
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.focus({ preventScroll: true });
        }
      }
    }
  }

  // NOTE: Recovery logic (when focused item is deleted) is now handled
  // by the OS Focus Pipeline (FocusGroup.tsx) using updateRecovery.
  // No App-level recovery code needed here.

  // Clear effects
  let nextState = rawNewState;
  if (rawNewState.effects && rawNewState.effects.length > 0) {
    nextState = produce(rawNewState, (draft) => {
      draft.effects = [];
    });
  }

  return nextState;
};
