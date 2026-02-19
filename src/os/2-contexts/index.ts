/**
 * Context Providers — Lazy DOM data injection for kernel commands.
 *
 * Each defineContext registers a provider function that is called
 * lazily when a command injects it via middleware.
 *
 * Provider reads:
 *   kernel.getState() → activeZoneId
 *   ZoneRegistry → config, element
 *   DOM queries → items, rects
 */

import { kernel } from "../kernel";
import type { FocusGroupConfig } from "../schemas/focus/config/FocusGroupConfig";
import { DEFAULT_CONFIG } from "../schemas/focus/config/FocusGroupConfig";
import type { NavigateEntry } from "../schemas/focus/config/FocusNavigateConfig";
import { ZoneRegistry } from "./zoneRegistry";

// ═══════════════════════════════════════════════════════════════════
// DOM_ITEMS — ordered item IDs within the active zone
// ═══════════════════════════════════════════════════════════════════

export const DOM_ITEMS = kernel.defineContext("dom-items", (): string[] => {
  const zoneId = kernel.getState().os.focus.activeZoneId;
  if (!zoneId) return [];

  const entry = ZoneRegistry.get(zoneId);
  if (!entry?.element) return [];

  const items: string[] = [];
  const els = entry.element.querySelectorAll(
    "[data-item-id]:not([data-nav-skip='true'])",
  );
  for (const el of els) {
    // Only include items that DIRECTLY belong to this zone (not nested child zones)
    if (el.closest("[data-focus-group]") !== entry.element) continue;
    const id = el.getAttribute("data-item-id");
    if (id) items.push(id);
  }

  // Dynamic item filter — zone-level hook for runtime filtering
  return entry.itemFilter ? entry.itemFilter(items) : items;
});

// ═══════════════════════════════════════════════════════════════════
// DOM_RECTS — item bounding rects (for spatial navigation)
// ═══════════════════════════════════════════════════════════════════

export const DOM_RECTS = kernel.defineContext(
  "dom-rects",
  (): Map<string, DOMRect> => {
    const zoneId = kernel.getState().os.focus.activeZoneId;
    if (!zoneId) return new Map();

    const entry = ZoneRegistry.get(zoneId);
    if (!entry?.element) return new Map();

    const rects = new Map<string, DOMRect>();
    const els = entry.element.querySelectorAll(
      "[data-item-id]:not([data-nav-skip='true'])",
    );
    for (const el of els) {
      // Only include items that DIRECTLY belong to this zone
      if (el.closest("[data-focus-group]") !== entry.element) continue;
      const id = el.getAttribute("data-item-id");
      if (id) rects.set(id, el.getBoundingClientRect());
    }

    // Dynamic item filter — apply same filter as DOM_ITEMS for consistency
    if (entry.itemFilter) {
      const allowedIds = new Set(entry.itemFilter(Array.from(rects.keys())));
      for (const id of rects.keys()) {
        if (!allowedIds.has(id)) rects.delete(id);
      }
    }
    return rects;
  },
);

// ═══════════════════════════════════════════════════════════════════
// ZONE_CONFIG — configuration for the active zone
// ═══════════════════════════════════════════════════════════════════

export const ZONE_CONFIG = kernel.defineContext(
  "zone-config",
  (): FocusGroupConfig => {
    const zoneId = kernel.getState().os.focus.activeZoneId;
    if (!zoneId) return DEFAULT_CONFIG;

    const entry = ZoneRegistry.get(zoneId);
    return entry?.config ?? DEFAULT_CONFIG;
  },
);

// ═══════════════════════════════════════════════════════════════════
// DOM_ZONE_ORDER — all zones in DOM order (for cross-zone Tab)
// ═══════════════════════════════════════════════════════════════════

export interface ZoneOrderEntry {
  zoneId: string;
  firstItemId: string | null;
  lastItemId: string | null;
  /** APG Tab recovery strategy from navigate.entry config */
  entry: NavigateEntry;
  /** First selected item in the zone (for entry="selected") */
  selectedItemId: string | null;
  /** Last focused item in the zone (for entry="restore") */
  lastFocusedId: string | null;
}

export const DOM_ZONE_ORDER = kernel.defineContext(
  "dom-zone-order",
  (): ZoneOrderEntry[] => {
    const state = kernel.getState();
    const zones: ZoneOrderEntry[] = [];
    const els = document.querySelectorAll("[data-focus-group]");
    for (const el of els) {
      const zoneId = el.getAttribute("data-focus-group");
      if (!zoneId) continue;

      // Collect items that DIRECTLY belong to this zone (not nested child zones).
      // An item belongs to a zone if its closest [data-focus-group] ancestor is this zone.
      const allItems = el.querySelectorAll(
        "[data-item-id]:not([data-nav-skip='true'])",
      );
      const ownItems: Element[] = [];
      for (const item of allItems) {
        const closestGroup = item.closest("[data-focus-group]");
        if (closestGroup === el) {
          ownItems.push(item);
        }
      }

      // Read zone state for recovery targets
      const zoneState = state.os.focus.zones[zoneId];
      const zoneEntry = ZoneRegistry.get(zoneId);
      const entry = zoneEntry?.config?.navigate?.entry ?? "first";

      zones.push({
        zoneId,
        firstItemId: ownItems[0]?.getAttribute("data-item-id") ?? null,
        lastItemId:
          ownItems[ownItems.length - 1]?.getAttribute("data-item-id") ?? null,
        entry,
        selectedItemId: zoneState?.selection?.[0] ?? null,
        lastFocusedId: zoneState?.lastFocusedId ?? null,
      });
    }
    return zones;
  },
);
