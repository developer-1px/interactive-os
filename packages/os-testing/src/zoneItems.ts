/**
 * Zone item resolution — bridge between ZoneRegistry and TestBot runner.
 *
 * Keeps @os-core import inside packages/ (facade-safe).
 * src/apps/ imports this via @os-testing instead of @os-core directly.
 */

import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";

/** Get items for a zone from ZoneRegistry's getItems() binding */
export function getZoneItems(zoneId: string): string[] {
  return ZoneRegistry.get(zoneId)?.getItems?.() ?? [];
}
