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
import { SELECTION_CLEAR } from "../selection/selection";
import { resolveFocusId } from "../utils/resolveFocusId";

export const OS_COPY = kernel.defineCommand("OS_COPY", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onCopy) return;

  const selection = zone?.selection ?? [];

  if (selection.length > 0) {
    // Multi-copy: first item overwrites clipboard, subsequent items append
    const onCopy = entry.onCopy;
    const commands = selection.map((id, i) => {
      const resolved = resolveFocusId(onCopy, id);
      if (i > 0) {
        return { ...resolved, payload: { ...resolved.payload, _multi: true } };
      }
      return resolved;
    });
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
    // Multi-cut: first item overwrites clipboard, subsequent items append
    const onCut = entry.onCut;
    const commands = selection.map((id, i) => {
      const resolved = resolveFocusId(onCut, id);
      if (i > 0) {
        return { ...resolved, payload: { ...resolved.payload, _multi: true } };
      }
      return resolved;
    });
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
