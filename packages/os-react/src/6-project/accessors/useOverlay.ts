/**
 * useOverlay — OS hook to check if an overlay is open.
 *
 * Encapsulates OS internal state path so apps don't need to know
 * `s.os.overlays.stack.some(e => e.id === id)`.
 */

import { OS_OVERLAY_CLOSE } from "@os-core/4-command/overlay/overlay";
import { os } from "@os-core/engine/kernel";

export function useOverlay(id: string): boolean {
  return os.useComputed((s) => s.os.overlays.stack.some((e) => e.id === id));
}

export function closeOverlay(id: string): void {
  os.dispatch(OS_OVERLAY_CLOSE({ id }));
}
