/**
 * OS_ACTIVATE Command — Enter key activation (kernel version)
 *
 * v10: activate.effect 삭제. 이전에 effect로 처리하던 동작(toggleExpand 등)은
 * roleRegistry의 action 배열이 직접 담당. OS_ACTIVATE는 순수 앱 콜백 호출 전용.
 *
 * Priority chain:
 * 1. Zone.onAction callback
 * 2. Item.onActivate callback (Trigger)
 * 3. OS_SELECT (selectable zones)
 * 4. Fallback click
 */

import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { os } from "../../engine/kernel";
import { OS_SELECT } from "../selection/select";
import { buildZoneCursor } from "../utils/buildZoneCursor";

export const OS_ACTIVATE = os.defineCommand("OS_ACTIVATE", [], (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  if (!activeZoneId) return;

  const zone = ctx.state.os.focus.zones[activeZoneId];
  if (!zone?.focusedItemId) return;

  // APG: disabled items cannot be activated
  if (ZoneRegistry.isDisabled(activeZoneId, zone.focusedItemId)) return;

  // Zone callback: pass cursor to onAction (takes priority over selection)
  const entry = ZoneRegistry.get(activeZoneId);
  if (entry?.onAction) {
    const cursor = buildZoneCursor(zone);
    if (!cursor) return;
    const result = entry.onAction(cursor);
    return { dispatch: result };
  }

  // Item-level callback: Trigger's onActivate registered via FocusItem
  const itemCb = ZoneRegistry.getItemCallback(activeZoneId, zone.focusedItemId);
  if (itemCb?.onActivate) {
    // Warn if trigger has callback but is not in zone's registered items
    const zoneItems = entry?.getItems?.();
    if (
      zoneItems &&
      zoneItems.length > 0 &&
      !zoneItems.includes(zone.focusedItemId)
    ) {
      console.warn(
        `[OS_ACTIVATE] Trigger '${zone.focusedItemId}' has onActivate callback but is not in zone '${activeZoneId}' items. The trigger may not be reachable by keyboard navigation.`,
      );
    }
    return { dispatch: itemCb.onActivate };
  }

  // W3C Tabs/Listbox Pattern: Enter selects the focused item.
  // Selectable zones (select.mode is not "none") get OS_SELECT on Enter.
  if (entry?.config?.select?.mode !== "none") {
    return {
      dispatch: OS_SELECT({
        targetId: zone.focusedItemId,
      }),
    };
  }

  // Fallback: programmatic click
  return {
    click: zone.focusedItemId,
  };
});
