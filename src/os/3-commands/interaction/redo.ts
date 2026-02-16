/**
 * OS_REDO Command — Cmd+Shift+Z key handler
 *
 * Dispatches the active zone's onRedo callback when registered.
 * Unlike OS_DELETE, redo operates on the zone level (not per-item).
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";

export const OS_REDO = kernel.defineCommand("OS_REDO", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onRedo) return;

  return { dispatch: entry.onRedo };
});
