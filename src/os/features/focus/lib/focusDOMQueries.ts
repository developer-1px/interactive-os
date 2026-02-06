/**
 * focusDOMQueries - DOM Query Utilities for Focus System
 * Pure DOM operations only - no store/data dependencies
 */

export const findFocusableItem = (el: HTMLElement) =>
    el.closest('[data-item-id]') as HTMLElement | null;

export const findZone = (el: HTMLElement) =>
    el.closest('[data-focus-group]') as HTMLElement | null;

export const getZoneId = (el: HTMLElement) =>
    el.getAttribute('data-focus-group');

export interface FocusTarget {
    itemId: string;
    itemEl: HTMLElement;
    groupId: string;
}

export function resolveFocusTarget(target: HTMLElement): FocusTarget | null {
    const itemEl = findFocusableItem(target);
    if (!itemEl?.id) return null;

    const zoneEl = findZone(itemEl);
    const groupId = zoneEl ? getZoneId(zoneEl) : null;
    if (!groupId) return null;

    return { itemId: itemEl.id, itemEl, groupId };
}
