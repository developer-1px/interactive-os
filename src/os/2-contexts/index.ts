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
import type { FocusGroupConfig } from "../schema/focus/config/FocusGroupConfig";
import { DEFAULT_CONFIG } from "../schema/focus/config/FocusGroupConfig";
import { ZoneRegistry } from "./zoneRegistry";

// ═══════════════════════════════════════════════════════════════════
// DOM_ITEMS — ordered item IDs within the active zone
// ═══════════════════════════════════════════════════════════════════

export const DOM_ITEMS = kernel.defineContext("dom-items", (): string[] => {
  const zoneId = kernel.getState().os.focus.activeZoneId;
  console.log("[DOM_ITEMS] Active zone:", zoneId);
  if (!zoneId) return [];

  const entry = ZoneRegistry.get(zoneId);
  console.log("[DOM_ITEMS] Zone entry:", entry);
  if (!entry?.element) return [];

  const items: string[] = [];
  const els = entry.element.querySelectorAll(
    "[data-item-id]:not([data-nav-skip='true'])",
  );
  els.forEach((el) => {
    const id = el.getAttribute("data-item-id");
    if (id) items.push(id);
  });
  console.log("[DOM_ITEMS] Found items:", items.length, items);
  return items;
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
    els.forEach((el) => {
      const id = el.getAttribute("data-item-id");
      if (id) rects.set(id, el.getBoundingClientRect());
    });
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
