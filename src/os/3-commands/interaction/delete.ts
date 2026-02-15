/**
 * OS_DELETE Command — Backspace/Delete key handler
 *
 * When the active zone has selected items, dispatches the zone's onDelete
 * callback for EACH selected item, then clears selection.
 * Falls back to single focused item when no selection exists.
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import { SELECTION_CLEAR } from "../selection/selection";
import { resolveFocusId } from "../utils/resolveFocusId";

export const OS_DELETE = kernel.defineCommand("OS_DELETE", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onDelete) return;

  const selection = zone?.selection ?? [];

  if (selection.length > 0) {
    // Multi-delete: dispatch for each selected item, then clear selection
    const onDelete = entry.onDelete;
    const commands = selection.map((id) => resolveFocusId(onDelete, id));
    commands.push(SELECTION_CLEAR({ zoneId: activeZoneId }));

    return { dispatch: commands };
  }

  // Single delete (existing behavior)
  if (!zone?.focusedItemId) return;
  return { dispatch: resolveFocusId(entry.onDelete, zone.focusedItemId) };
});
