import { ZoneRegistry } from "./zoneRegistry";

// ═══════════════════════════════════════════════════════════════════
// getZoneItems — Read ordered item IDs from DOM (same logic as DOM_ITEMS)
// ═══════════════════════════════════════════════════════════════════

/**
 * Read the ordered item IDs for a zone, directly from the DOM.
 * Same logic as the DOM_ITEMS context provider, but callable from hooks.
 *
 * Used by Lazy Resolution to resolve stale focusedItemId at read-time.
 */
export function getZoneItems(zoneId: string): string[] {
  const entry = ZoneRegistry.get(zoneId);
  if (!entry?.element) return [];

  const items: string[] = [];
  const els = entry.element.querySelectorAll("[data-item-id]");
  for (const el of els) {
    if (el.closest("[data-focus-group]") !== entry.element) continue;
    const id = el.getAttribute("data-item-id");
    if (id) items.push(id);
  }

  return entry.itemFilter ? entry.itemFilter(items) : items;
}

// ═══════════════════════════════════════════════════════════════════
// findItemElement — Zone-scoped element lookup (single source)
// ═══════════════════════════════════════════════════════════════════

/**
 * Find the DOM element for an item, scoped to the active zone first.
 *
 * When the same entity id appears in multiple zones (e.g., sidebar + canvas),
 * this resolves to the correct element by searching within the given zone's
 * container. Falls back to document-global lookup.
 *
 * This is the single canonical implementation — used by:
 * - 4-effects (focus, scroll)
 * - defineQuery providers (FOCUSED_ELEMENT)
 */
export function findItemElement(
  zoneId: string | null,
  itemId: string,
): HTMLElement | null {
  const zoneEl = zoneId ? ZoneRegistry.get(zoneId)?.element : null;

  // 1. Zone-scoped: look inside the zone container first
  if (zoneEl) {
    const scoped = zoneEl.querySelector<HTMLElement>(
      `[data-item-id="${itemId}"]`,
    );
    if (scoped) return scoped;
  }

  // 2. Fallback: document-global
  return (
    (document.querySelector(
      `[data-item-id="${itemId}"]`,
    ) as HTMLElement | null) ?? document.getElementById(itemId)
  );
}

// ═══════════════════════════════════════════════════════════════════
// Item Attribute Query
// ═══════════════════════════════════════════════════════════════════

/**
 * Read a data attribute from an item element within a zone.
 *
 * OS reads DOM so apps don't have to.
 *
 * @example
 *   getItemAttribute("canvas", "hero", "data-level")  // → "section"
 */
export function getItemAttribute(
  zoneId: string,
  itemId: string,
  attribute: string,
): string | null {
  const entry = ZoneRegistry.get(zoneId);
  if (!entry?.element) return null;

  const el = entry.element.querySelector(`[data-item-id="${itemId}"]`);
  return el?.getAttribute(attribute) ?? null;
}

// ═══════════════════════════════════════════════════════════════════
// Item Hierarchy — derived from DOM nesting
// ═══════════════════════════════════════════════════════════════════

/**
 * Get the first descendant item matching a specific attribute value.
 *
 * @example
 *   getFirstDescendantWithAttribute("canvas", "hero", "data-level", "group")
 *   // → "hero-cards" (first group inside hero section)
 */
export function getFirstDescendantWithAttribute(
  zoneId: string,
  parentId: string,
  attribute: string,
  value: string,
): string | null {
  const entry = ZoneRegistry.get(zoneId);
  if (!entry?.element) return null;

  const parentEl = entry.element.querySelector(`[data-item-id="${parentId}"]`);
  if (!parentEl) return null;

  const descendant = parentEl.querySelector(
    `[data-item-id][${attribute}="${value}"]`,
  );
  if (!descendant) return null;

  const id = descendant.getAttribute("data-item-id");
  return id !== parentId ? id : null;
}

/**
 * Get the closest ancestor item matching a specific attribute value.
 *
 * @example
 *   getAncestorWithAttribute("canvas", "hero-title", "data-level", "section")
 *   // → "hero" (closest section ancestor)
 */
export function getAncestorWithAttribute(
  zoneId: string,
  itemId: string,
  attribute: string,
  value: string,
): string | null {
  const entry = ZoneRegistry.get(zoneId);
  if (!entry?.element) return null;

  const el = entry.element.querySelector(`[data-item-id="${itemId}"]`);
  if (!el) return null;

  let current = el.parentElement;
  while (current && current !== entry.element) {
    const currentItemId = current.getAttribute("data-item-id");
    if (currentItemId && current.getAttribute(attribute) === value) {
      return currentItemId;
    }
    current = current.parentElement;
  }
  return null;
}
