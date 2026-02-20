/**
 * OS Effects — DOM side-effect handlers (re-frame reg-fx pattern)
 *
 * Commands return effects as inline map keys: { focus: itemId, scroll: itemId }
 * Kernel matches these keys to handlers registered here via os.defineEffect.
 *
 * These are the only place where DOM mutation happens.
 */

import { ZoneRegistry } from "../2-contexts/zoneRegistry";
import { os } from "../kernel";

// ═══════════════════════════════════════════════════════════════════
// Zone-scoped element lookup
// ═══════════════════════════════════════════════════════════════════

/**
 * Find the DOM element for an item, scoped to the active zone first.
 *
 * When the same entity id appears in multiple zones (e.g., sidebar + canvas),
 * this resolves to the correct element by searching within the active zone's
 * container. Falls back to document-global lookup.
 */
function findItemElement(itemId: string): HTMLElement | null {
  const zoneId = os.getState().os.focus.activeZoneId;
  const zoneEl = zoneId ? ZoneRegistry.get(zoneId)?.element : null;

  // 1. Zone-scoped: look inside the active zone container first
  if (zoneEl) {
    const scoped = zoneEl.querySelector<HTMLElement>(
      `[data-item-id="${itemId}"]`,
    );
    if (scoped) return scoped;
  }

  // 2. Fallback: document-global (for zones without registry or legacy paths)
  return (
    (document.querySelector(
      `[data-item-id="${itemId}"]`,
    ) as HTMLElement | null) ?? document.getElementById(itemId)
  );
}

// ═══════════════════════════════════════════════════════════════════
// Focus Effect — Move DOM focus to an element
// ═══════════════════════════════════════════════════════════════════

os.defineEffect("focus", (itemId: string) => {
  const el = findItemElement(itemId);
  if (el) {
    el.focus({ preventScroll: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Scroll Effect — Scroll element into view
// ═══════════════════════════════════════════════════════════════════

os.defineEffect("scroll", (itemId: string) => {
  const el = findItemElement(itemId);
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
