/**
 * OS_MOVE_UP / OS_MOVE_DOWN Commands — Meta+Arrow reordering
 *
 * Dispatches the active zone's onMoveUp/onMoveDown callbacks with resolved focus ID.
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import { resolveFocusId } from "../utils/resolveFocusId";

export const OS_MOVE_UP = kernel.defineCommand("OS_MOVE_UP", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  if (!zone?.focusedItemId) return;

  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onMoveUp) return;

  return { dispatch: resolveFocusId(entry.onMoveUp, zone.focusedItemId) };
});

export const OS_MOVE_DOWN = kernel.defineCommand(
  "OS_MOVE_DOWN",
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone?.focusedItemId) return;

    const entry = ZoneRegistry.get(activeZoneId);
    if (!entry?.onMoveDown) return;

    return { dispatch: resolveFocusId(entry.onMoveDown, zone.focusedItemId) };
  },
);
