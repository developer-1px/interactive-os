/**
 * OS_DELETE Command — Backspace/Delete key handler
 *
 * Dispatches the active zone's onDelete callback with resolved focus ID.
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import { resolveFocusId } from "../utils/resolveFocusId";

export const OS_DELETE = kernel.defineCommand("OS_DELETE", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  if (!zone?.focusedItemId) return;

  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onDelete) return;

  return { dispatch: resolveFocusId(entry.onDelete, zone.focusedItemId) };
});
