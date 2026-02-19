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
 * Get the closest ancestor item of an item.
 *
 * Walks up the DOM from the item's parent until it finds another
 * [data-item-id] element, within the same zone boundary.
 */
export function getItemParent(
    zoneId: string,
    itemId: string,
): string | null {
    const entry = ZoneRegistry.get(zoneId);
    if (!entry?.element) return null;

    const el = entry.element.querySelector(`[data-item-id="${itemId}"]`);
    if (!el) return null;

    // Walk up. Stop at zone boundary.
    let current = el.parentElement;
    while (current && current !== entry.element) {
        const parentItemId = current.getAttribute("data-item-id");
        if (parentItemId) return parentItemId;
        current = current.parentElement;
    }
    return null;
}

/**
 * Get direct child items of an item (one level of nesting).
 *
 * Returns item IDs that are immediate children in the item tree
 * (not DOM children — item tree children, skipping non-item elements).
 */
export function getItemChildren(
    zoneId: string,
    parentId: string,
): string[] {
    const entry = ZoneRegistry.get(zoneId);
    if (!entry?.element) return [];

    const parentEl = entry.element.querySelector(
        `[data-item-id="${parentId}"]`,
    );
    if (!parentEl) return [];

    const children: string[] = [];
    const allItems = parentEl.querySelectorAll("[data-item-id]");
    for (const el of allItems) {
        const id = el.getAttribute("data-item-id");
        if (!id || id === parentId) continue;
        // Only direct children: their closest ancestor item is parentId
        let ancestor = el.parentElement;
        let closestItemId: string | null = null;
        while (ancestor && ancestor !== parentEl) {
            const ancestorItemId = ancestor.getAttribute("data-item-id");
            if (ancestorItemId && ancestorItemId !== parentId) {
                closestItemId = ancestorItemId;
                break;
            }
            ancestor = ancestor.parentElement;
        }
        // If no intermediate item found, it's a direct child
        if (!closestItemId) {
            children.push(id);
        }
    }
    return children;
}

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

    const parentEl = entry.element.querySelector(
        `[data-item-id="${parentId}"]`,
    );
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
