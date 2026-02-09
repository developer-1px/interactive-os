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
// Blur Effect — Remove focus from active element
// ═══════════════════════════════════════════════════════════════════

export const BLUR_EFFECT = kernel.defineEffect("blur", () => {
  (document.activeElement as HTMLElement)?.blur();
});

// ═══════════════════════════════════════════════════════════════════
// Click Effect — Synthesize click on element
// ═══════════════════════════════════════════════════════════════════

export const CLICK_EFFECT = kernel.defineEffect("click", (itemId: string) => {
  const el =
    (document.querySelector(
      `[data-item-id="${itemId}"]`,
    ) as HTMLElement | null) ?? document.getElementById(itemId);
  if (el) {
    el.click();
  }
});
