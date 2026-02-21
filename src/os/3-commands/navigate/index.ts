/**
 * OS_NAVIGATE Command — Arrow key navigation (kernel version)
 *
 * Reuses the existing pure navigation resolvers:
 *   - resolveNavigate (strategies.ts / resolve.ts)
 *   - handleSeamlessNavigation logic will be deferred to Phase 5 (cross-zone)
 *
 * For now focuses on within-zone navigation.
 */

import { produce } from "immer";
import {
  DOM_EXPANDABLE_ITEMS,
  DOM_ITEMS,
  DOM_RECTS,
  DOM_TREE_LEVELS,
  ZONE_CONFIG,
} from "../../2-contexts";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { os } from "../../kernel";
import { applyFollowFocus, ensureZone } from "../../state/utils";
import { OS_EXPAND } from "../expand";
import { buildZoneCursor } from "../utils/buildZoneCursor";
import { resolveNavigate } from "./resolve";

type Direction = "up" | "down" | "left" | "right" | "home" | "end";

interface NavigatePayload {
  direction: Direction;
  select?: "range" | "toggle";
}

export const OS_NAVIGATE = os.defineCommand(
  "OS_NAVIGATE",
  [DOM_ITEMS, DOM_RECTS, ZONE_CONFIG, DOM_EXPANDABLE_ITEMS, DOM_TREE_LEVELS],
  (ctx) => (payload: NavigatePayload) => {
    const { activeZoneId } = ctx.state.os.focus;
    if (!activeZoneId) return;

    const zone = ctx.state.os.focus.zones[activeZoneId];
    if (!zone) return;

    const items: string[] = ctx.inject(DOM_ITEMS);
    const itemRects: Map<string, DOMRect> = ctx.inject(DOM_RECTS);
    const config = ctx.inject(ZONE_CONFIG);

    if (items.length === 0) return;

    // W3C Tree Pattern: ArrowRight/ArrowLeft handle expand/collapse
    // Only applies to tree/treegrid roles — not toolbars or other zones.
    const zoneEntry = ZoneRegistry.get(activeZoneId);
    const isTreeRole =
      zoneEntry?.role === "tree" || zoneEntry?.role === "treegrid";

    let overrideTargetId: string | null = null;

    if (
      isTreeRole &&
      (payload.direction === "right" || payload.direction === "left")
    ) {
      const focusedId = zone.focusedItemId;
      if (focusedId) {
        const isExpanded = zone.expandedItems.includes(focusedId);
        // Expandability is determined by DOM projection (aria-expanded presence)
        const expandableItems = ctx.inject(DOM_EXPANDABLE_ITEMS);
        const isExpandable = expandableItems.has(focusedId);

        if (isExpandable) {
          if (payload.direction === "right" && !isExpanded) {
            return {
              dispatch: OS_EXPAND({ action: "expand", itemId: focusedId }),
            };
          }
          if (payload.direction === "left" && isExpanded) {
            return {
              dispatch: OS_EXPAND({
                action: "collapse",
                itemId: focusedId,
              }),
            };
          }
        }

        // APG Tree: Hierarchy Jump
        const treeLevels = ctx.inject(DOM_TREE_LEVELS);

        if (payload.direction === "right" && isExpandable && isExpanded) {
          const idx = items.indexOf(focusedId);
          const nextId = items[idx + 1];
          if (nextId) {
            const currentLevel = treeLevels.get(focusedId) ?? 1;
            const nextLevel = treeLevels.get(nextId) ?? 1;
            if (nextLevel > currentLevel) {
              overrideTargetId = nextId;
            }
          }
        }

        if (payload.direction === "left" && (!isExpandable || !isExpanded)) {
          const idx = items.indexOf(focusedId);
          const currentLevel = treeLevels.get(focusedId) ?? 1;
          for (let i = idx - 1; i >= 0; i--) {
            const prevId = items[i];
            if (!prevId) continue;
            const prevLevel = treeLevels.get(prevId) ?? 1;
            if (prevLevel < currentLevel) {
              overrideTargetId = prevId;
              break;
            }
          }
        }
      }
    }

    // APG: Arrow navigation skips disabled items
    const disabledSet = ZoneRegistry.getDisabledItems(activeZoneId);
    const navigableItems = items.filter((id) => !disabledSet.has(id));
    if (navigableItems.length === 0) return;

    // Delegate to existing pure resolver OR use override
    const navResult = overrideTargetId
      ? {
        targetId: overrideTargetId,
        stickyX: zone.stickyX,
        stickyY: zone.stickyY,
      }
      : resolveNavigate(
        zone.focusedItemId,
        payload.direction,
        navigableItems,
        config.navigate,
        {
          stickyX: zone.stickyX,
          stickyY: zone.stickyY,
          itemRects,
        },
      );

    const result = {
      state: produce(ctx.state, (draft) => {
        const z = ensureZone(draft.os, activeZoneId);
        z.focusedItemId = navResult.targetId ?? null;
        z.stickyX = navResult.stickyX;
        z.stickyY = navResult.stickyY;

        // Exit editing mode on navigation
        z.editingItemId = null;

        if (navResult.targetId) {
          z.lastFocusedId = navResult.targetId;
        }

        // Handle shift+arrow selection
        if (payload.select === "range" && navResult.targetId) {
          const anchor =
            z.selectionAnchor || zone.focusedItemId || navResult.targetId;
          const anchorIdx = items.indexOf(anchor);
          const targetIdx = items.indexOf(navResult.targetId);
          if (anchorIdx !== -1 && targetIdx !== -1) {
            const start = Math.min(anchorIdx, targetIdx);
            const end = Math.max(anchorIdx, targetIdx);
            z.selection = items.slice(start, end + 1);
            z.selectionAnchor = anchor;
          }
        }

        if (!payload.select && navResult.targetId) {
          applyFollowFocus(z, navResult.targetId, config.select);
        }
      }) as typeof ctx.state,

      // Effects
      scroll: navResult.targetId,
    };

    // Dispatch onSelect callback if selection changed
    if (zoneEntry?.onSelect && navResult.targetId) {
      const updatedZone = result.state.os.focus.zones[activeZoneId];
      const prevSelection = zone.selection;
      const newSelection = updatedZone?.selection;
      if (
        newSelection &&
        (newSelection.length !== prevSelection.length ||
          newSelection.some((id: string, i: number) => id !== prevSelection[i]))
      ) {
        const cursor = buildZoneCursor(updatedZone);
        if (cursor) {
          return {
            ...result,
            dispatch: zoneEntry.onSelect(cursor),
          };
        }
      }
    }

    return result;
  },
);
