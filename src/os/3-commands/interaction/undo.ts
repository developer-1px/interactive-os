/**
 * OS_UNDO Command — Cmd+Z key handler
 *
 * Dispatches the active zone's onUndo callback when registered.
 * Unlike OS_DELETE, undo operates on the zone level (not per-item).
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";

export const OS_UNDO = os.defineCommand("OS_UNDO", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onUndo) return;

  return { dispatch: entry.onUndo };
});
