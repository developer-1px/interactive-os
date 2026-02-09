/**
 * useActiveZone — Which zone is currently active?
 */

import { kernel } from "../kernel";

export function useActiveZone(): string | null {
  return kernel.useComputed((s) => s.os.focus.activeZoneId);
}
