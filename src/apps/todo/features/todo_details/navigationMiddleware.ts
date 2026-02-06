import { produce } from "immer";
import type { AppState, TodoCommand } from "@apps/todo/model/types";
import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { OS_COMMANDS } from "@os/features/command/definitions/commandsShell";
import { FocusData } from "@os/features/focus/lib/focusData";


export const navigationMiddleware = (
  rawNewState: AppState,
  _action: TodoCommand,
  _prevState: AppState,
): AppState => {
  const effects = [...(rawNewState.effects || [])];

  // --- FOCUS_ID Effect Handling ---
  // Dispatch OS Command instead of directly manipulating store
  const focusEffect = effects.find(
    (e): e is { type: "FOCUS_ID"; id: string | number } => e.type === "FOCUS_ID"
  );

  if (focusEffect && focusEffect.id !== null) {
    // Defer until after React render so new items are registered
    requestAnimationFrame(() => {
      const dispatch = useCommandEngineStore.getState().getActiveDispatch();
      const activeGroupId = FocusData.getActiveZoneId();

      if (dispatch && activeGroupId) {
        dispatch({
          type: OS_COMMANDS.FOCUS,
          payload: { id: String(focusEffect.id), zoneId: activeGroupId }
        });
      }
    });
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

