/**
 * OS_MOVE_UP / OS_MOVE_DOWN Commands — Meta+Arrow reordering
 *
 * Passes ZoneCursor to the active zone's onMoveUp/onMoveDown callbacks.
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const OS_MOVE_UP = kernel.defineCommand("OS_MOVE_UP", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  const entry = ZoneRegistry.get(activeZoneId);
  if (!entry?.onMoveUp) return;

  const cursor = buildZoneCursor(zone);
  if (!cursor) return;

  return { dispatch: entry.onMoveUp(cursor) };
});

export const OS_MOVE_DOWN = kernel.defineCommand(
  "OS_MOVE_DOWN",
  (ctx) => () => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    const entry = ZoneRegistry.get(activeZoneId);
    if (!entry?.onMoveDown) return;

    const cursor = buildZoneCursor(zone);
    if (!cursor) return;

    return { dispatch: entry.onMoveDown(cursor) };
  },
);
