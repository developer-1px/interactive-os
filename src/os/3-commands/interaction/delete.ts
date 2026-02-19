/**
 * OS_DELETE Command — Backspace/Delete key handler
 *
 * Constructs a ZoneCursor and passes it to the zone's onDelete callback.
 * The app decides how to handle single vs multi-select deletion.
 *
 * OS wraps the returned command(s) in a transaction for single-undo (⌘Z),
 * then clears selection.
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import {
  beginTransaction,
  endTransaction,
} from "../../middlewares/historyKernelMiddleware";
import { SELECTION_CLEAR } from "../selection/selection";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const OS_DELETE = kernel.defineCommand("OS_DELETE", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onDelete) return;

  const cursor = buildZoneCursor(zone);
  if (!cursor) return;

  const result = entry.onDelete(cursor);
  const commands = Array.isArray(result) ? result : [result];

  // Wrap in transaction for single-undo, then clear selection
  if (cursor.selection.length > 0) {
    beginTransaction();
    commands.push(SELECTION_CLEAR({ zoneId: activeZoneId }));
    queueMicrotask(endTransaction);
  }

  return { dispatch: commands };
});
