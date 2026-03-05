/**
 * OS_NAVIGATE Command — Arrow key navigation (kernel version)
 *
 * Reuses the existing pure navigation resolvers:
 *   - resolveNavigate (strategies.ts / resolve.ts)
 *   - handleSeamlessNavigation logic will be deferred to Phase 5 (cross-zone)
 *
 * For now focuses on within-zone navigation.
 */

import {
  DOM_EXPANDABLE_ITEMS,
  DOM_ITEMS,
  DOM_RECTS,
  DOM_TREE_LEVELS,
  ZONE_CONFIG,
} from "@os-core/3-inject";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { produce } from "immer";
import { os } from "../../engine/kernel";
import { applyFollowFocus, ensureZone } from "../../schema/state/utils";
import { OS_EXPAND } from "../expand";
import { buildZoneCursor } from "../utils/buildZoneCursor";
import { resolveNavigate } from "./resolve";
import { strategyNeedsDOMRects } from "./strategies";

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

    const zoneEntry = ZoneRegistry.get(activeZoneId);

    // DOM_ITEMS provider decides the source:
    //   browser:        querySelectorAll (rendered truth)
    //   headless+React: renderToString → parse data-item-id
    //   pure headless:  getItems() fallback
    const items: string[] = ctx.inject(DOM_ITEMS);
    const config = ctx.inject(ZONE_CONFIG);

    if (items.length === 0) return;

    // DOM_RECTS causes getBoundingClientRect layout-flush on every item.
    // Only inject when the active strategy actually needs it (spatial/corner).
    // Strategy declares needsDOMRects — no hardcoding here (OCP).
    const itemRects: Map<string, DOMRect> = strategyNeedsDOMRects(
      config.navigate.orientation,
    )
      ? ctx.inject(DOM_RECTS)
      : new Map();

    // ── Chain executor: config-driven cross-axis behavior ──
    // Reads onRight/onLeft/onDown/onUp from NavigateConfig.
    // Each is a string[] fallback chain of atomic actions.
    // Falls back to normal linear navigation if no chain defined.
    const directionChainMap: Record<string, string[] | undefined> = {
      right: config.navigate.onRight,
      left: config.navigate.onLeft,
      up: config.navigate.onUp,
      down: config.navigate.onDown,
    };
    const chain = directionChainMap[payload.direction];

    let overrideTargetId: string | null = null;

    if (chain && chain.length > 0) {
      const focusedId = zone.focusedItemId;
      if (focusedId) {
        const expandableItems = ctx.inject(DOM_EXPANDABLE_ITEMS);
        const isExpandable = expandableItems.has(focusedId);
        const isExpanded = !!zone.items?.[focusedId]?.["aria-expanded"];
        const treeLevels = ctx.inject(DOM_TREE_LEVELS);

        // Chain trace for transaction log observability
        const chainTrace: Array<{ action: string; result: string }> = [];

        for (const action of chain) {
          if (action === "expand" && isExpandable && !isExpanded) {
            chainTrace.push({ action, result: "resolved" });
            return {
              dispatch: OS_EXPAND({ action: "expand", itemId: focusedId }),
              chainTrace,
            };
          }
          if (action === "collapse" && isExpandable && isExpanded) {
            chainTrace.push({ action, result: "resolved" });
            return {
              dispatch: OS_EXPAND({ action: "collapse", itemId: focusedId }),
              chainTrace,
            };
          }
          if (action === "enterChild" && isExpandable && isExpanded) {
            const idx = items.indexOf(focusedId);
            const nextId = items[idx + 1];
            if (nextId) {
              const currentLevel = treeLevels.get(focusedId) ?? 1;
              const nextLevel = treeLevels.get(nextId) ?? 1;
              if (nextLevel > currentLevel) {
                chainTrace.push({ action, result: "resolved" });
                overrideTargetId = nextId;
                break;
              }
            }
          }
          if (action === "goParent") {
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
            if (overrideTargetId) {
              chainTrace.push({ action, result: "resolved" });
              break;
            }
          }
          chainTrace.push({ action, result: "skipped" });
        }
        // If chain consumed but no action succeeded → noop (return early if no override)
        if (!overrideTargetId) return { chainTrace };
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

        // Handle shift+arrow selection (only if zone supports range)
        // W3C APG: Shift+Arrow is multi-select only. Single-select zones ignore.
        if (
          payload.select === "range" &&
          navResult.targetId &&
          config.select.range
        ) {
          const anchor =
            z.selectionAnchor || zone.focusedItemId || navResult.targetId;
          const anchorIdx = items.indexOf(anchor);
          const targetIdx = items.indexOf(navResult.targetId);
          if (anchorIdx !== -1 && targetIdx !== -1) {
            const start = Math.min(anchorIdx, targetIdx);
            const end = Math.max(anchorIdx, targetIdx);
            const rangeIds = items.slice(start, end + 1);
            // Clear all, then select range
            for (const id of Object.keys(z.items)) {
              if (z.items[id]?.["aria-selected"]) {
                z.items[id] = { ...z.items[id], "aria-selected": false };
              }
            }
            for (const id of rangeIds) {
              if (!z.items[id]) z.items[id] = {};
              z.items[id] = { ...z.items[id], "aria-selected": true };
            }
            z.selectionAnchor = anchor;
          }
        }

        if (!payload.select && navResult.targetId) {
          applyFollowFocus(z, navResult.targetId, config.select);
        }

        // Shift+Arrow on single-select: apply followFocus instead of range
        if (
          payload.select === "range" &&
          navResult.targetId &&
          !config.select.range
        ) {
          applyFollowFocus(z, navResult.targetId, config.select);
        }
      }) as typeof ctx.state,

      // Effects
      scroll: navResult.targetId,
    };

    // Dispatch onSelect callback if selection changed
    if (zoneEntry?.onSelect && navResult.targetId) {
      const updatedZone = result.state.os.focus.zones[activeZoneId];
      // Compare selection via items map
      const prevSelected = new Set(
        Object.keys(zone.items ?? {}).filter(
          (id) => zone.items[id]?.["aria-selected"],
        ),
      );
      const newSelected = new Set(
        Object.keys(updatedZone?.items ?? {}).filter(
          (id) => updatedZone?.items[id]?.["aria-selected"],
        ),
      );
      const changed =
        prevSelected.size !== newSelected.size ||
        [...prevSelected].some((id) => !newSelected.has(id));
      if (changed) {
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
