/**
 * OS Effects — DOM side-effect handlers (re-frame reg-fx pattern)
 *
 * Commands return effects as inline map keys: { focus: itemId, scroll: itemId }
 * Kernel matches these keys to handlers registered here via os.defineEffect.
 *
 * These are the only place where DOM mutation happens.
 */

import { findItemElement } from "@os-core/3-inject/itemQueries";
import { os } from "@os-core/engine/kernel";

// ═══════════════════════════════════════════════════════════════════
// Focus Effect — DOM focus restore
//
// Normal focus transitions are handled by FocusItem.useLayoutEffect
// (state change → re-render → DOM focus). This effect exists for
// cases where DOM focus needs to be restored without state change
// (e.g., focus lost to body after element removal).
// ═══════════════════════════════════════════════════════════════════

os.defineEffect("focus", (itemId: string) => {
  const zoneId = os.getState().os.focus.activeZoneId;
  const el = findItemElement(zoneId, itemId);
  if (el) {
    el.focus({ preventScroll: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Scroll Effect — Scroll element into view (only when needed)
//
// scrollIntoView({ block: "nearest" }) can still cause micro-scroll
// in nested scroll containers with padding (e.g., Builder canvas
// with pt-14/pb-8). We check actual visibility first.
// ═══════════════════════════════════════════════════════════════════

/** Find the nearest scrollable ancestor of an element. */
function findScrollParent(el: HTMLElement): HTMLElement | null {
  let current = el.parentElement;
  while (current) {
    const { overflowY } = getComputedStyle(current);
    if (overflowY === "auto" || overflowY === "scroll") return current;
    current = current.parentElement;
  }
  return null;
}

/** Check if element is fully visible within its scroll container. */
function isFullyVisible(el: HTMLElement, container: HTMLElement): boolean {
  const er = el.getBoundingClientRect();
  const cr = container.getBoundingClientRect();
  return (
    er.top >= cr.top &&
    er.bottom <= cr.bottom &&
    er.left >= cr.left &&
    er.right <= cr.right
  );
}

os.defineEffect("scroll", (itemId: string) => {
  const zoneId = os.getState().os.focus.activeZoneId;
  const el = findItemElement(zoneId, itemId);
  if (!el) return;

  const scrollParent = findScrollParent(el);
  if (scrollParent && isFullyVisible(el, scrollParent)) return;

  el.scrollIntoView({ block: "nearest", inline: "nearest" });
});

// ═══════════════════════════════════════════════════════════════════
// Trigger Focus Effect — Restore focus to trigger after overlay close
//
// When an overlay closes and its TriggerConfig has focus.onClose: "restore",
// OS_OVERLAY_CLOSE returns { triggerFocus: triggerId }. This effect finds
// the trigger element via data-trigger-id and focuses it.
//
// Runs synchronously in the same call stack as dispatch — before React
// re-renders. The trigger element is guaranteed to be in the DOM at
// this point (overlay portal is conditionally rendered, not the trigger).
// ═══════════════════════════════════════════════════════════════════

os.defineEffect("triggerFocus", (triggerId: string) => {
  const el = document.querySelector(`[data-trigger-id="${triggerId}"]`);
  if (el instanceof HTMLElement) {
    el.focus({ preventScroll: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Clipboard Write Effect — Write text to native clipboard
// ═══════════════════════════════════════════════════════════════════

os.defineEffect(
  "clipboardWrite",
  (payload: { text: string; json?: string }) => {
    navigator.clipboard.writeText(payload.text).catch(() => {
      // Clipboard API may fail in non-secure contexts — silent fallback
    });
  },
);

// ═══════════════════════════════════════════════════════════════════
// Field Clear — Imperative DOM mutation (direct import, not effect)
// ═══════════════════════════════════════════════════════════════════

/** Imperative DOM clear — callable from queueMicrotask in commands. */
export function clearFieldDOM(fieldId: string): void {
  const el = document.getElementById(fieldId);
  if (el) {
    el.innerText = "";
  }
}
