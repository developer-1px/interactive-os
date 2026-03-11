/**
 * senseClickTarget — DOM → ClickTarget for pointerup click routing.
 *
 * Classifies what the user clicked on by reading DOM attributes
 * and registry/state. Symmetric to senseMouseDown (pointerdown path).
 *
 * Pipeline: PointerEvent target → senseClickTarget → resolveClick/resolveTriggerClick → dispatch
 */

import { os } from "@os-core/engine/kernel";
import { TriggerOverlayRegistry } from "@os-core/engine/registries/triggerRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { findFocusableItem } from "../_shared/domQuery";

// ═══════════════════════════════════════════════════════════════════
// ClickTarget — Discriminated union for pointerup click routing
// ═══════════════════════════════════════════════════════════════════

export type ClickTarget =
  | {
      type: "trigger";
      triggerId: string;
      overlayId: string;
      overlayType: string;
      isOpen: boolean;
    }
  | { type: "simple-trigger"; triggerId: string; payload: string | null }
  | { type: "expand"; itemId: string; zoneId: string }
  | { type: "check"; itemId: string; zoneId: string }
  | { type: "item"; itemId: string | null; isCurrentPage: boolean }
  | { type: "none" };

/**
 * senseClickTarget — DOM → ClickTarget for pointerup click routing.
 *
 * Classifies what the user clicked on by reading DOM attributes
 * and registry/state. Symmetric to senseMouseDown (pointerdown path).
 *
 * Pipeline: PointerEvent target → senseClickTarget → resolveClick/resolveTriggerClick → dispatch
 */
export function senseClickTarget(target: HTMLElement): ClickTarget {
  // Trigger: overlay toggle or simple (non-overlay) trigger
  const triggerEl = target.closest("[data-trigger-id]") as HTMLElement;
  if (triggerEl) {
    const triggerId = triggerEl.getAttribute("data-trigger-id");
    if (triggerId) {
      const triggerMeta = TriggerOverlayRegistry.get(triggerId);
      if (triggerMeta) {
        const overlayStack = os.getState().os.overlays.stack;
        const isOpen = overlayStack.some(
          (o: { id: string }) => o.id === triggerMeta.overlayId,
        );
        return {
          type: "trigger",
          triggerId,
          overlayId: triggerMeta.overlayId,
          overlayType: triggerMeta.overlayType,
          isOpen,
        };
      }
      // Non-overlay trigger with registered callback
      const itemCb = ZoneRegistry.findItemCallback(triggerId);
      if (itemCb?.onActivate) {
        const payload = triggerEl.getAttribute("data-trigger-payload");
        return { type: "simple-trigger", triggerId, payload };
      }
    }
  }

  // Sub-item triggers: expand / check
  if (
    target.closest("[data-expand-trigger]") ||
    target.closest("[data-check-trigger]")
  ) {
    const activeZoneId = os.getState().os.focus.activeZoneId;
    if (!activeZoneId) return { type: "none" };
    const itemEl = findFocusableItem(target);
    const itemId = itemEl?.id ?? null;
    if (!itemId) return { type: "none" };
    const subType = target.closest("[data-expand-trigger]")
      ? "expand"
      : "check";
    return {
      type: subType as "expand" | "check",
      itemId,
      zoneId: activeZoneId,
    };
  }

  // Normal item click
  const itemEl = findFocusableItem(target);
  return {
    type: "item",
    itemId: itemEl?.id ?? null,
    isCurrentPage: itemEl?.getAttribute("aria-current") === "page",
  };
}
