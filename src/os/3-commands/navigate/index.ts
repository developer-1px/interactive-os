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
import { DOM_ITEMS, DOM_RECTS, ZONE_CONFIG } from "../../2-contexts";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { kernel } from "../../kernel";
import { ensureZone } from "../../state/utils";
import {
  getChildRole,
  isExpandableRole,
} from "../../registries/roleRegistry";
import { EXPAND } from "../expand";
import { resolveNavigate } from "./resolve";

type Direction = "up" | "down" | "left" | "right" | "home" | "end";

interface NavigatePayload {
  direction: Direction;
  select?: "range" | "toggle";
}

export const NAVIGATE = kernel.defineCommand(
  "OS_NAVIGATE",
  [DOM_ITEMS, DOM_RECTS, ZONE_CONFIG],
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

    if (
      isTreeRole &&
      (payload.direction === "right" || payload.direction === "left")
    ) {
      const focusedId = zone.focusedItemId;
      if (focusedId) {
        const isExpanded = zone.expandedItems.includes(focusedId);
        // Expandability is determined by role, not DOM attribute.
        // FocusItem renders aria-expanded when isExpandableRole(childRole) is true.
        const childRole = getChildRole(zoneEntry?.role);
        const isExpandable = childRole ? isExpandableRole(childRole) : false;

        if (isExpandable) {
          if (payload.direction === "right" && !isExpanded) {
            return {
              dispatch: EXPAND({ action: "expand", itemId: focusedId }),
            };
          }
          if (payload.direction === "left" && isExpanded) {
            return {
              dispatch: EXPAND({
                action: "collapse",
                itemId: focusedId,
              }),
            };
          }
        }
      }
    }

    // APG: Arrow navigation skips disabled items
    const disabledSet = new Set(zone.disabledItems);
    const navigableItems = items.filter((id) => !disabledSet.has(id));
    if (navigableItems.length === 0) return;

    // Delegate to existing pure resolver
    const navResult = resolveNavigate(
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

    return {
      state: produce(ctx.state, (draft) => {
        const z = ensureZone(draft.os, activeZoneId);
        z.focusedItemId = navResult.targetId;
        z.stickyX = navResult.stickyX;
        z.stickyY = navResult.stickyY;

        // Exit editing mode on navigation
        z.editingItemId = null;

        if (navResult.targetId) {
          z.lastFocusedId = navResult.targetId;
          z.recoveryTargetId = null;

          // Auto-compute recovery target
          const idx = items.indexOf(navResult.targetId);
          if (idx !== -1) {
            z.recoveryTargetId = items[idx + 1] ?? items[idx - 1] ?? null;
          }
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

        if (
          !payload.select &&
          config.select.followFocus &&
          config.select.mode !== "none" &&
          navResult.targetId
        ) {
          z.selection = [navResult.targetId];
          z.selectionAnchor = navResult.targetId;
        }
      }) as typeof ctx.state,

      // Effects
      // Skip DOM focus if virtualFocus is enabled
      focus: config.project.virtualFocus ? undefined : navResult.targetId,
      scroll: navResult.targetId,
    };
  },
);
