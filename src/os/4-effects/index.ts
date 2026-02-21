/**
 * OS Effects — DOM side-effect handlers (re-frame reg-fx pattern)
 *
 * Commands return effects as inline map keys: { focus: itemId, scroll: itemId }
 * Kernel matches these keys to handlers registered here via os.defineEffect.
 *
 * These are the only place where DOM mutation happens.
 */

import { findItemElement } from "../2-contexts/itemQueries";
import { os } from "../kernel";

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
// Scroll Effect — Scroll element into view
// ═══════════════════════════════════════════════════════════════════

os.defineEffect("scroll", (itemId: string) => {
  const zoneId = os.getState().os.focus.activeZoneId;
  const el = findItemElement(zoneId, itemId);
  if (el) {
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
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
