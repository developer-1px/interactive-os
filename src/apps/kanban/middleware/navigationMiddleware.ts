import type { KanbanCommand, KanbanState } from "@apps/kanban/model/types";
import { FocusData } from "@os/features/focus/lib/focusData";
import { produce } from "immer";

export const navigationMiddleware = (
  rawNewState: KanbanState,
  _action: KanbanCommand,
  _prevState: KanbanState,
): KanbanState => {
  const effects = [...(rawNewState.effects || [])];

  // --- FOCUS_ID Effect Handling (Cross-Zone Capable) ---
  const focusEffect = effects.find(
    (e): e is { type: "FOCUS_ID"; id: string | number } =>
      e.type === "FOCUS_ID",
  );

  if (focusEffect && focusEffect.id !== null) {
    const targetId = String(focusEffect.id);
    const targetEl = document.getElementById(targetId);

    if (targetEl) {
      // Strategy: Find which zone owns this element, activate it, then focus
      const activeGroupId = FocusData.getActiveZoneId();

      // First try: check if target is in the currently active zone
      let resolved = false;
      if (activeGroupId) {
        const data = FocusData.getById(activeGroupId);
        if (data) {
          const zoneEl = document.getElementById(activeGroupId);
          if (zoneEl && zoneEl.contains(targetEl)) {
            data.store.setState({ focusedItemId: targetId });
            targetEl.focus({ preventScroll: false });
            resolved = true;
          }
        }
      }

      // Second try: scan all zones for the target element (cross-zone teleport)
      if (!resolved) {
        const allZoneIds = FocusData.getOrderedZones();
        for (const zoneId of allZoneIds) {
          const zoneEl = document.getElementById(zoneId);
          if (zoneEl && zoneEl.contains(targetEl)) {
            const data = FocusData.getById(zoneId);
            if (data) {
              // Activate the target zone
              FocusData.setActiveZone(zoneId);
              // Update the zone's store to point to the target item
              data.store.setState({ focusedItemId: targetId });
              // DOM focus
              targetEl.focus({ preventScroll: false });
              resolved = true;
              break;
            }
          }
        }
      }

      // Fallback: raw DOM focus
      if (!resolved) {
        targetEl.focus({ preventScroll: false });
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
