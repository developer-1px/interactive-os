import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { FocusData } from "../lib/focusData";

/**
 * Hook to subscribe to the global focus path.
 * Returns true if the provided groupId is in the current focus path.
 */
export function useIsFocusedGroup(groupId: string): boolean {
  const _activeZoneId = useSyncExternalStore(
    FocusData.subscribeActiveZone,
    () => FocusData.getActiveZoneId(),
    () => null,
  );

  const [isInPath, setIsInPath] = useState(false);

  // We use useLayoutEffect to ensure aria-current updates before paint
  // when the active zone changes.
  useLayoutEffect(() => {
    const path = FocusData.getFocusPath();
    setIsInPath(path.includes(groupId));
  }, [groupId]);

  return isInPath;
}
