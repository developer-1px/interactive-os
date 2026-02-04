import { produce } from "immer";
import type { AppState, TodoCommand, AppEffect } from "@apps/todo/model/types";
import { useFocusStore } from "@os/features/focus/model/useFocusStore";


export const navigationMiddleware = (
  rawNewState: AppState,
  _action: TodoCommand,
  _prevState: AppState,
): AppState => {
  // 1. Effect Processing Pipeline
  const effects = [...(rawNewState.effects || [])];


  if (effects.length > 0) {
    effects.forEach((effect: AppEffect) => {
      // --- EFFECT: SET FOCUS DIRECTLY ---
      if (effect.type === "FOCUS_ID") {
        if (effect.id !== null) {
          useFocusStore.getState().setFocus(String(effect.id));
        }
      }
    });
  }

  // --- IMMEDIATE: OS NAVIGATION HANDLING ---
  // Since the Reducer doesn't "know" about layout/DOM, we handle navigation logic here
  // by querying the OS Focus Store (which has the Registry & DOM references).



  // 2. Data Integrity Checks
  // (Logic migrated to OS level)

  // 3. Clear Effects
  let nextState = rawNewState;
  if (rawNewState.effects && rawNewState.effects.length > 0) {
    nextState = produce(rawNewState, (draft) => {
      draft.effects = [];
    });
  }





  return nextState;
};


