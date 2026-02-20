/**
 * OS Clipboard Commands — OS_COPY, OS_CUT, OS_PASTE
 *
 * Passes ZoneCursor to zone callbacks. App decides batch vs per-item.
 * OS handles selection clear after cut.
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";
import { OS_SELECTION_CLEAR } from "../selection/selection";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const OS_COPY = os.defineCommand("OS_COPY", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onCopy) return;

  const cursor = buildZoneCursor(zone);
  if (!cursor) return;

  return { dispatch: entry.onCopy(cursor) };
});

export const OS_CUT = os.defineCommand("OS_CUT", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onCut) return;

  const cursor = buildZoneCursor(zone);
  if (!cursor) return;

  const result = entry.onCut(cursor);
  const commands = Array.isArray(result) ? [...result] : [result];

  // OS clears selection after cut
  if (cursor.selection.length > 0) {
    commands.push(OS_SELECTION_CLEAR({ zoneId: activeZoneId }));
  }

  return { dispatch: commands };
});

export const OS_PASTE = os.defineCommand("OS_PASTE", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onPaste) return;

  // Paste: cursor with focusId (paste target). Empty focusId = append at end.
  const cursor = buildZoneCursor(zone) ?? {
    focusId: "",
    selection: [],
    anchor: null,
  };

  return { dispatch: entry.onPaste(cursor) };
});
