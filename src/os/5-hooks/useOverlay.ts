/**
 * useOverlay — OS hook to check if an overlay is open.
 *
 * Encapsulates OS internal state path so apps don't need to know
 * `s.os.overlays.stack.some(e => e.id === id)`.
 */

import { os } from "@/os/kernel";

export function useOverlay(id: string): boolean {
  return os.useComputed((s) => s.os.overlays.stack.some((e) => e.id === id));
}
