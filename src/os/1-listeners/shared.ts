/**
 * Shared DOM query utilities for 1-listeners.
 *
 * Centralizes DOM traversal patterns used by both Mouse and Focus listeners
 * to avoid duplication across W3C event modules.
 */

// ═══════════════════════════════════════════════════════════════════
// DOM Query
// ═══════════════════════════════════════════════════════════════════

export const findFocusableItem = (el: HTMLElement) =>
  el.closest("[data-item-id]") as HTMLElement | null;

export interface FocusTargetInfo {
  itemId: string;
  groupId: string;
}

export function resolveFocusTarget(
  target: HTMLElement,
): FocusTargetInfo | null {
  const itemEl = findFocusableItem(target);
  if (!itemEl?.id) return null;

  const zoneEl = itemEl.closest("[data-focus-group]") as HTMLElement | null;
  const groupId = zoneEl?.getAttribute("data-focus-group") ?? null;
  if (!groupId) return null;

  return { itemId: itemEl.id, groupId };
}

// ═══════════════════════════════════════════════════════════════════
// Re-entrance Guard
// ═══════════════════════════════════════════════════════════════════

/**
 * Tracks whether the kernel is executing a command that may trigger
 * DOM focus events (el.focus()). Prevents focusin → SYNC_FOCUS loop.
 *
 * Set by MouseListener, read by FocusListener. Shared here to avoid
 * circular dependency between mouse/ and focus/ modules.
 */
let dispatching = false;

export function setDispatching(value: boolean) {
  dispatching = value;
}

export function isDispatching(): boolean {
  return dispatching;
}
