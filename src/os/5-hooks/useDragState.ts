/**
 * useDragState — Read drag-and-drop state from kernel.
 *
 * Returns the current drag state for a specific zone,
 * or the global drag state if no zoneId is provided.
 */

import { os } from "@os/kernel";
import type { DragState } from "@os/state/OSState";

/** Read the global drag state */
export function useDragState(): DragState;
/** Read drag state filtered to a specific zone */
export function useDragState(
  zoneId: string,
): DragState & { isActiveZone: boolean };
export function useDragState(zoneId?: string) {
  return os.useComputed((s) => {
    const drag = s.os.drag;
    if (zoneId) {
      return { ...drag, isActiveZone: drag.zoneId === zoneId };
    }
    return drag;
  });
}
