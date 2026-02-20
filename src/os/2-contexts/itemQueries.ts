/**
 * Item Queries — OS-level DOM abstractions for item hierarchy.
 *
 * The DOM tree already encodes parent-child relationships between items.
 * These utilities expose that structure as data, so apps never touch DOM.
 *
 * Rule: DOM은 OS에서만 읽는다. 앱은 이 API만 사용한다.
 */

import { ZoneRegistry } from "./zoneRegistry";

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
