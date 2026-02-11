/**
 * useIsFocusedGroup — kernel-based hook.
 *
 * Returns true if the provided groupId matches the current active zone.
 */

import { kernel } from "@/os-new/kernel";

export function useIsFocusedGroup(groupId: string): boolean {
  return kernel.useComputed((state) => state.os.focus.activeZoneId === groupId);
}
