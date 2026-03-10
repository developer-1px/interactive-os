/**
 * typeIntoField — Type text into the active field.
 *
 * Finds the active zone's registered field and updates its value.
 */

import { readActiveZoneId } from "@os-core/3-inject/compute";
import { os } from "@os-core/engine/kernel";
import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";

export function typeIntoField(text: string): void {
  const activeZone = readActiveZoneId(os);
  if (!activeZone) return;
  const zoneEntry = ZoneRegistry.get(activeZone);
  if (zoneEntry?.fieldId) {
    FieldRegistry.updateValue(zoneEntry.fieldId, text);
  }
}
