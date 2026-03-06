import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";

/** Safe CSS.escape — falls back to basic escaping in jsdom (no CSS.escape). */
const cssEscape =
  typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape
    : (s: string) => s.replace(/([^\w-])/g, "\\$1");

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
 * - 5-effect (focus, scroll)
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
      `#${cssEscape(itemId)}`,
    );
    if (scoped) return scoped;
  }

  // 2. Fallback: document-global
  return document.getElementById(itemId);
}

// ═══════════════════════════════════════════════════════════════════
// getZoneItems — delegates to ZoneRegistry.resolveItems
// ═══════════════════════════════════════════════════════════════════

/**
 * Get ordered item IDs for a zone (headless-safe, no DOM).
 * Delegates to ZoneRegistry.resolveItems as single source of truth.
 */
export function getZoneItems(zoneId: string): string[] {
  return ZoneRegistry.resolveItems(zoneId);
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

  const el = entry.element.querySelector(`#${cssEscape(itemId)}`);
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

  const parentEl = entry.element.querySelector(`#${cssEscape(parentId)}`);
  if (!parentEl) return null;

  const descendant = parentEl.querySelector(
    `[data-item][${attribute}="${value}"]`,
  );
  if (!descendant) return null;

  const id = descendant.id;
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

  const el = entry.element.querySelector(`#${cssEscape(itemId)}`);
  if (!el) return null;

  let current = el.parentElement;
  while (current && current !== entry.element) {
    if (current.id && current.getAttribute(attribute) === value) {
      return current.id;
    }
    current = current.parentElement;
  }
  return null;
}
