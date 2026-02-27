/**
 * Context Providers — Lazy DOM data injection for kernel commands.
 *
 * Each defineContext registers a provider function that is called
 * lazily when a command injects it via middleware.
 *
 * Provider reads:
 *   os.getState() → activeZoneId
 *   ZoneRegistry → config, element
 *   DOM queries → items, rects
 */

import { os } from "../kernel";
import type { FocusGroupConfig } from "../schemas/focus/config/FocusGroupConfig";
import { DEFAULT_CONFIG } from "../schemas/focus/config/FocusGroupConfig";
import type { NavigateEntry } from "../schemas/focus/config/FocusNavigateConfig";
import { ZoneRegistry } from "./zoneRegistry";

// ═══════════════════════════════════════════════════════════════════
// DOM_EXPANDABLE_ITEMS — Set of item IDs that have aria-expanded attribute
// ═══════════════════════════════════════════════════════════════════

export const DOM_EXPANDABLE_ITEMS = os.defineContext(
  "dom-expandable-items",
  (): Set<string> => {
    const zoneId = os.getState().os.focus.activeZoneId;
    if (!zoneId) return new Set();

    const entry = ZoneRegistry.get(zoneId);
    if (!entry) return new Set();

    // Push model: use accessor (headless-compatible)
    if (entry.getExpandableItems) return entry.getExpandableItems();

    return new Set();
  },
);

// ═══════════════════════════════════════════════════════════════════
// DOM_TREE_LEVELS — Map of item IDs to their aria-level (default 1)
// ═══════════════════════════════════════════════════════════════════

export const DOM_TREE_LEVELS = os.defineContext(
  "dom-tree-levels",
  (): Map<string, number> => {
    const zoneId = os.getState().os.focus.activeZoneId;
    if (!zoneId) return new Map();

    const entry = ZoneRegistry.get(zoneId);
    if (!entry) return new Map();

    // Push model: use accessor (headless-compatible)
    if (entry.getTreeLevels) return entry.getTreeLevels();

    return new Map();
  },
);

// ═══════════════════════════════════════════════════════════════════
// DOM_ITEMS — ordered item IDs within the active zone
// ═══════════════════════════════════════════════════════════════════

export const DOM_ITEMS = os.defineContext("dom-items", (): string[] => {
  const zoneId = os.getState().os.focus.activeZoneId;
  if (!zoneId) return [];

  // resolveItems: getItems() → element DOM scan → empty array.
  // Resilient to Phase 1 useMemo wiping auto-generated getItems.
  const items = ZoneRegistry.resolveItems(zoneId);
  const entry = ZoneRegistry.get(zoneId);
  return entry?.itemFilter ? entry.itemFilter(items) : items;
});

// ═══════════════════════════════════════════════════════════════════
// DOM_RECTS — item bounding rects (for spatial navigation)
// ═══════════════════════════════════════════════════════════════════

export const DOM_RECTS = os.defineContext(
  "dom-rects",
  (): Map<string, DOMRect> => {
    const zoneId = os.getState().os.focus.activeZoneId;
    if (!zoneId) return new Map();

    const entry = ZoneRegistry.get(zoneId);
    if (!entry?.element) return new Map();

    const rects = new Map<string, DOMRect>();
    const els = entry.element.querySelectorAll("[data-item-id]");
    for (const el of els) {
      // Only include items that DIRECTLY belong to this zone
      if (el.closest("[data-zone]") !== entry.element) continue;
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

export const ZONE_CONFIG = os.defineContext(
  "zone-config",
  (): FocusGroupConfig => {
    const zoneId = os.getState().os.focus.activeZoneId;
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

export const DOM_ZONE_ORDER = os.defineContext(
  "dom-zone-order",
  (): ZoneOrderEntry[] => {
    const state = os.getState();
    const zones: ZoneOrderEntry[] = [];

    // Push model: registry order + getItems() accessors only.
    // Zones without getItems() are skipped (they have no discoverable items).
    const registeredZoneIds = ZoneRegistry.orderedKeys();

    for (const zoneId of registeredZoneIds) {
      const zoneEntry = ZoneRegistry.get(zoneId);
      if (!zoneEntry) continue;

      const zoneState = state.os.focus.zones[zoneId];
      const entry = zoneEntry.config?.navigate?.entry ?? "first";

      const items = zoneEntry.getItems?.();
      if (items) {
        const filtered = zoneEntry.itemFilter
          ? zoneEntry.itemFilter(items)
          : items;
        zones.push({
          zoneId,
          firstItemId: filtered[0] ?? null,
          lastItemId: filtered[filtered.length - 1] ?? null,
          entry,
          selectedItemId: zoneState?.selection?.[0] ?? null,
          lastFocusedId: zoneState?.lastFocusedId ?? null,
        });
      }
    }

    return zones;
  },
);
