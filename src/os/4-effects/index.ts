/**
 * OS Effects — DOM side-effect handlers (re-frame reg-fx pattern)
 *
 * Commands return effects as inline map keys: { focus: itemId, scroll: itemId }
 * Kernel matches these keys to handlers registered here via os.defineEffect.
 *
 * These are the only place where DOM mutation happens.
 */

import { os } from "../kernel";

// ═══════════════════════════════════════════════════════════════════
// Focus Effect — Move DOM focus to an element
// ═══════════════════════════════════════════════════════════════════

os.defineEffect("focus", (itemId: string) => {
  const el =
    (document.querySelector(
      `[data-item-id="${itemId}"]`,
    ) as HTMLElement | null) ?? document.getElementById(itemId);
  if (el) {
    el.focus({ preventScroll: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Scroll Effect — Scroll element into view
// ═══════════════════════════════════════════════════════════════════

os.defineEffect("scroll", (itemId: string) => {
  const el =
    (document.querySelector(
      `[data-item-id="${itemId}"]`,
    ) as HTMLElement | null) ?? document.getElementById(itemId);
  if (el) {
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
});

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
