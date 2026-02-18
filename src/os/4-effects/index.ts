/**
 * OS Effects — DOM side-effect handlers (kernel version)
 *
 * Registered via kernel.defineEffect.
 * These are the only place where DOM mutation happens.
 */

import { kernel } from "../kernel";

// ═══════════════════════════════════════════════════════════════════
// Focus Effect — Move DOM focus to an element
// ═══════════════════════════════════════════════════════════════════

export const FOCUS_EFFECT = kernel.defineEffect("focus", (itemId: string) => {
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

export const SCROLL_EFFECT = kernel.defineEffect("scroll", (itemId: string) => {
  const el =
    (document.querySelector(
      `[data-item-id="${itemId}"]`,
    ) as HTMLElement | null) ?? document.getElementById(itemId);
  if (el) {
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Field Clear Effect — Clear contentEditable field DOM content
// ═══════════════════════════════════════════════════════════════════

/** Imperative DOM clear — callable from queueMicrotask in commands. */
export function clearFieldDOM(fieldId: string): void {
  const el = document.getElementById(fieldId);
  if (el) {
    el.innerText = "";
  }
}

export const FIELD_CLEAR_EFFECT = kernel.defineEffect("field-clear", clearFieldDOM);
