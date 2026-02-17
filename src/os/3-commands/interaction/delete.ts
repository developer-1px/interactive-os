/**
 * OS_DELETE Command — Backspace/Delete key handler
 *
 * When the active zone has selected items, dispatches the zone's onDelete
 * callback for EACH selected item, then clears selection.
 * Falls back to single focused item when no selection exists.
 *
 * Multi-delete items are grouped in a transaction so that ⌘Z undoes all at once.
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import {
  beginTransaction,
  endTransaction,
} from "../../middlewares/historyKernelMiddleware";
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
    // Multi-delete: wrap in transaction for single-undo (⌘Z)
    // `beginTransaction()` sets a global groupId that history middleware reads.
    // Kernel dispatch queue is synchronous — commands returned via `dispatch:`
    // effect are processed in the same event loop turn. We defer `endTransaction`
    // to a microtask so the groupId persists through all queued delete commands.
    const onDelete = entry.onDelete;
    beginTransaction();
    const commands = selection.map((id) => resolveFocusId(onDelete, id));
    commands.push(SELECTION_CLEAR({ zoneId: activeZoneId }));
    queueMicrotask(endTransaction);

    return { dispatch: commands };
  }

  // Single delete (existing behavior)
  if (!zone?.focusedItemId) return;
  return { dispatch: resolveFocusId(entry.onDelete, zone.focusedItemId) };
});
