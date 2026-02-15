/**
 * OS Clipboard Commands — OS_COPY, OS_CUT, OS_PASTE
 *
 * OS-level commands for clipboard operations.
 * When the active zone has selected items, dispatches the zone's callback
 * for EACH selected item. Falls back to single focused item otherwise.
 *
 * Zone binding: <OS.Zone onCopy={TODO_COPY()} onCut={TODO_CUT()} onPaste={TODO_PASTE()}>
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import { resolveFocusId } from "../utils/resolveFocusId";
import { SELECTION_CLEAR } from "../selection/selection";

export const OS_COPY = kernel.defineCommand("OS_COPY", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onCopy) return;

  const selection = zone?.selection ?? [];

  if (selection.length > 0) {
    // Multi-copy: dispatch for each selected item
    const onCopy = entry.onCopy;
    const commands = selection.map((id) => resolveFocusId(onCopy, id));
    return { dispatch: commands };
  }

  // Single copy (existing behavior)
  const focusedItemId = zone?.focusedItemId;
  return {
    dispatch: focusedItemId
      ? resolveFocusId(entry.onCopy, focusedItemId)
      : entry.onCopy,
  };
});

export const OS_CUT = kernel.defineCommand("OS_CUT", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onCut) return;

  const selection = zone?.selection ?? [];

  if (selection.length > 0) {
    // Multi-cut: dispatch for each selected item, then clear selection
    const onCut = entry.onCut;
    const commands = selection.map((id) => resolveFocusId(onCut, id));
    commands.push(SELECTION_CLEAR({ zoneId: activeZoneId }));
    return { dispatch: commands };
  }

  // Single cut (existing behavior)
  const focusedItemId = zone?.focusedItemId;
  return {
    dispatch: focusedItemId
      ? resolveFocusId(entry.onCut, focusedItemId)
      : entry.onCut,
  };
});

export const OS_PASTE = kernel.defineCommand("OS_PASTE", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onPaste) return;

  const focusedItemId = zone?.focusedItemId;
  return {
    dispatch: focusedItemId
      ? resolveFocusId(entry.onPaste, focusedItemId)
      : entry.onPaste,
  };
});
