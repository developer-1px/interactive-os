/**
 * OS_SELECT Command — aria-selected state management (kernel version)
 *
 * Writes items[id]["aria-selected"] directly.
 * For aria-checked toggling, use OS_CHECK instead.
 * For aria-pressed toggling, use OS_PRESS instead.
 */

import { DOM_ITEMS, ZONE_CONFIG } from "@os-core/3-inject";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { produce } from "immer";
import { os } from "../../engine/kernel";
import { ensureZone } from "../../schema/state/utils";
import { buildZoneCursor } from "../utils/buildZoneCursor";

interface SelectPayload {
  targetId?: string;
  mode?: "single" | "replace" | "toggle" | "range";
}

/** Helper: set aria-selected for an item */
function setSelected(z: { items: Record<string, { "aria-selected"?: boolean }> }, id: string, val: boolean) {
  if (!z.items[id]) z.items[id] = {};
  z.items[id] = { ...z.items[id], "aria-selected": val };
}

/** Helper: count currently selected items */
function countSelected(z: { items: Record<string, { "aria-selected"?: boolean }> }): number {
  return Object.values(z.items).filter((s) => s?.["aria-selected"]).length;
}

/** Helper: clear all aria-selected */
function clearSelected(z: { items: Record<string, { "aria-selected"?: boolean }> }) {
  for (const id of Object.keys(z.items)) {
    if (z.items[id]?.["aria-selected"]) {
      z.items[id] = { ...z.items[id], "aria-selected": false };
    }
  }
}

export const OS_SELECT = os.defineCommand(
  "OS_SELECT",
  [DOM_ITEMS, ZONE_CONFIG],
  (ctx) => (payload: SelectPayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const targetId = payload.targetId ?? zone.focusedItemId;
    if (!targetId) return;

    const zoneConfig = ctx.inject(ZONE_CONFIG);
    if (zoneConfig.select.mode === "none") return;

    if (ZoneRegistry.isDisabled(activeZoneId, targetId)) return;

    const items: string[] = ctx.inject(DOM_ITEMS);
    const zoneEntry = ZoneRegistry.get(activeZoneId);

    const deriveMode = (): "replace" | "toggle" => {
      if (zoneConfig.select.mode === "multiple") return "toggle";
      if (zoneConfig.select.toggle) return "toggle";
      return "replace";
    };

    const enforceMode = (
      requested: "single" | "replace" | "toggle" | "range",
    ): "single" | "replace" | "toggle" | "range" => {
      if (requested === "range" && !zoneConfig.select.range) return "replace";
      if (
        requested === "toggle" &&
        zoneConfig.select.mode !== "multiple" &&
        !zoneConfig.select.toggle
      )
        return "replace";
      return requested;
    };

    const mode = enforceMode(payload.mode ?? deriveMode());

    const result = {
      state: produce(ctx.state, (draft) => {
        const z = ensureZone(draft.os, activeZoneId);

        switch (mode) {
          case "single":
          case "replace":
            clearSelected(z);
            setSelected(z, targetId, true);
            z.selectionAnchor = targetId;
            break;

          case "toggle": {
            const isSelected = z.items[targetId]?.["aria-selected"] ?? false;
            if (isSelected) {
              const disallowEmpty = zoneConfig.select.disallowEmpty ?? false;
              if (disallowEmpty && countSelected(z) <= 1) break;
              setSelected(z, targetId, false);
            } else {
              setSelected(z, targetId, true);
              z.selectionAnchor = targetId;
            }
            break;
          }

          case "range": {
            const anchor = z.selectionAnchor ?? targetId;
            const anchorIdx = items.indexOf(anchor);
            const targetIdx = items.indexOf(targetId);
            if (anchorIdx !== -1 && targetIdx !== -1) {
              const start = Math.min(anchorIdx, targetIdx);
              const end = Math.max(anchorIdx, targetIdx);
              clearSelected(z);
              for (const id of items.slice(start, end + 1)) {
                setSelected(z, id, true);
              }
              z.selectionAnchor = anchor;
            }
            break;
          }
        }
      }) as typeof ctx.state,
    };

    if (zoneEntry?.onSelect) {
      const updatedZone = result.state.os.focus.zones[activeZoneId];
      const cursor = buildZoneCursor(updatedZone);
      if (cursor) {
        return {
          ...result,
          dispatch: zoneEntry.onSelect(cursor),
        };
      }
    }

    return result;
  },
);
