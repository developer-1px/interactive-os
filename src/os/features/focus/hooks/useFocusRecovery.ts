import { CommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { useEffect, useSyncExternalStore } from "react";
import { OS_COMMANDS } from "@/os-new/schema/command/OSCommands";
import { FocusData } from "../lib/focusData";

/**
 * Hook to automatically recover focus when the active zone has no focused item.
 * This handles initial mounting and edge cases where focus is lost.
 */
export function useFocusRecovery() {
  const activeZoneId = useSyncExternalStore(
    FocusData.subscribeActiveZone,
    () => FocusData.getActiveZoneId(),
    () => null,
  );

  const activeData = useSyncExternalStore(
    FocusData.subscribeActiveZone,
    () => FocusData.getActiveZone(),
    () => undefined,
  );

  useEffect(() => {
    if (!activeZoneId || !activeData) return;

    // Check if the active zone has a focused item
    const state = activeData.store.getState();

    if (!state.focusedItemId) {
      // No item focused in the active zone -> Attempt recovery
      // We use a small timeout to allow for mounting/rendering to stabilize
      const timer = setTimeout(() => {
        // Re-check state before dispatching
        if (!activeData.store.getState().focusedItemId) {
          CommandEngineStore.dispatch({ type: OS_COMMANDS.RECOVER });
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [activeZoneId, activeData]);
}
