/**
 * Shared DOM sense functions for mouse-like interactions.
 *
 * These functions read DOM state and produce typed inputs
 * for pure resolve functions. No side effects, no dispatch.
 *
 * Used by: PointerListener (and headless simulateClick)
 */

import { os } from "@os-core/engine/kernel";
import { TriggerOverlayRegistry } from "@os-core/engine/registries/triggerRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { findFocusableItem, resolveFocusTarget } from "../_shared/domQuery";
import type { MouseInput } from "../mouse/resolveMouse";

// ═══════════════════════════════════════════════════════════════════
// Pure Interface: MouseDownSense
// ═══════════════════════════════════════════════════════════════════

export interface MouseDownSense {
  // Label path
  isLabel: boolean;
  labelTargetItemId: string | null;
  labelTargetGroupId: string | null;
  // Normal item path
  itemId: string | null;
  groupId: string | null;
  hasAriaExpanded: boolean;
  itemRole: string | null;
  // Zone-only path
  zoneId: string | null;
  // Trigger path
  triggerId: string | null;
  triggerOverlayId: string | null;
  triggerRole: string | null;
  isTriggerOverlayOpen: boolean;
  // Modifiers
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Extract: MouseDownSense → MouseInput
// ═══════════════════════════════════════════════════════════════════

export function extractMouseInput(input: MouseDownSense): MouseInput | null {
  // Non-overlay trigger: skip focus handling, pointerup will dispatch onActivate
  if (input.triggerId && !input.triggerOverlayId) return null;

  // Label path
  if (input.isLabel) {
    if (!input.labelTargetItemId) return null;
    return {
      targetItemId: null,
      targetGroupId: null,
      shiftKey: input.shiftKey,
      metaKey: input.metaKey,
      ctrlKey: input.ctrlKey,
      altKey: input.altKey,
      isLabel: true,
      labelTargetItemId: input.labelTargetItemId,
      labelTargetGroupId: input.labelTargetGroupId,
      hasAriaExpanded: false,
      itemRole: null,
    };
  }

  // Normal item path
  if (input.itemId) {
    return {
      targetItemId: input.itemId,
      targetGroupId: input.groupId,
      shiftKey: input.shiftKey,
      metaKey: input.metaKey,
      ctrlKey: input.ctrlKey,
      altKey: input.altKey,
      isLabel: false,
      labelTargetItemId: null,
      labelTargetGroupId: null,
      hasAriaExpanded: input.hasAriaExpanded,
      itemRole: input.itemRole,
    };
  }

  // Zone-only path
  if (input.zoneId) {
    return {
      targetItemId: null,
      targetGroupId: input.zoneId,
      shiftKey: input.shiftKey,
      metaKey: input.metaKey,
      ctrlKey: input.ctrlKey,
      altKey: input.altKey,
      isLabel: false,
      labelTargetItemId: null,
      labelTargetGroupId: null,
      hasAriaExpanded: false,
      itemRole: null,
    };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// DOM Adapter: reads DOM → MouseDownSense → extractMouseInput
// ═══════════════════════════════════════════════════════════════════

export function senseMouseDown(
  target: HTMLElement,
  e: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean; altKey: boolean },
): MouseInput | null {
  if (!target) return null;

  // Label detection (DOM reading)
  const label = target.closest("[data-label]") as HTMLElement | null;
  let isLabel = false;
  let labelTargetItemId: string | null = null;
  let labelTargetGroupId: string | null = null;

  if (label) {
    isLabel = true;
    const targetId = label.getAttribute("data-for");
    const targetField = targetId
      ? document.getElementById(targetId)
      : (label.querySelector('[role="textbox"]') as HTMLElement | null);

    if (targetField) {
      const fieldTarget = resolveFocusTarget(targetField);
      if (fieldTarget) {
        labelTargetItemId = fieldTarget.itemId;
        labelTargetGroupId = fieldTarget.groupId;
      }
    }
  }

  // Item detection (DOM reading)
  const item = !isLabel ? findFocusableItem(target) : null;
  let itemId: string | null = null;
  let groupId: string | null = null;
  let hasAriaExpanded = false;
  let itemRole: string | null = null;

  if (item) {
    const focusTarget = resolveFocusTarget(item);
    if (focusTarget) {
      itemId = focusTarget.itemId;
      groupId = focusTarget.groupId;
    }
    hasAriaExpanded = item.hasAttribute("aria-expanded");
    itemRole = item.getAttribute("role");
  }

  // Zone detection (DOM reading)
  const zoneEl =
    !isLabel && !item
      ? (target.closest("[data-zone]") as HTMLElement | null)
      : null;
  const zoneId = zoneEl?.getAttribute("data-zone") ?? null;

  // Trigger detection (DOM reading)
  const triggerEl = target.closest("[data-trigger-id]") as HTMLElement | null;
  const triggerId = triggerEl?.getAttribute("data-trigger-id") ?? null;
  let triggerOverlayId: string | null = null;
  let triggerRole: string | null = null;
  let isTriggerOverlayOpen = false;

  if (triggerId) {
    const triggerMeta = TriggerOverlayRegistry.get(triggerId);
    if (triggerMeta) {
      triggerOverlayId = triggerMeta.overlayId;
      triggerRole = triggerMeta.overlayType;
      const overlayStack = os.getState().os?.overlays?.stack ?? [];
      isTriggerOverlayOpen = overlayStack.some(
        (o: { id: string }) => o.id === triggerMeta.overlayId,
      );
    }
  }

  return extractMouseInput({
    isLabel,
    labelTargetItemId,
    labelTargetGroupId,
    itemId,
    groupId,
    hasAriaExpanded,
    itemRole,
    zoneId,
    triggerId,
    triggerOverlayId,
    triggerRole,
    isTriggerOverlayOpen,
    shiftKey: e.shiftKey,
    metaKey: e.metaKey,
    ctrlKey: e.ctrlKey,
    altKey: e.altKey,
  });
}

// ═══════════════════════════════════════════════════════════════════
// Pure Interface: DropSenseInput
// ═══════════════════════════════════════════════════════════════════

export interface DropSenseInput {
  clientY: number;
  items: Array<{ itemId: string; top: number; bottom: number }>;
}

// ═══════════════════════════════════════════════════════════════════
// Extract: DropSenseInput → Drop result
// ═══════════════════════════════════════════════════════════════════

export function extractDropPosition(
  input: DropSenseInput,
): { overItemId: string; position: "before" | "after" } | null {
  for (const item of input.items) {
    if (input.clientY >= item.top && input.clientY <= item.bottom) {
      const mid = item.top + (item.bottom - item.top) / 2;
      return {
        overItemId: item.itemId,
        position: input.clientY < mid ? "before" : "after",
      };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// DOM Adapter: reads DOM → DropSenseInput → extractDropPosition
// ═══════════════════════════════════════════════════════════════════

export function getDropPosition(
  e: { clientY: number },
  zoneEl: HTMLElement,
): { overItemId: string; position: "before" | "after" } | null {
  const nodeList = zoneEl.querySelectorAll("[data-item]");
  const items: DropSenseInput["items"] = [];

  for (const node of nodeList) {
    if (node.closest("[data-zone]") !== zoneEl) continue;
    const rect = node.getBoundingClientRect();
    const itemId = (node as HTMLElement).id;
    if (!itemId) continue;
    items.push({ itemId, top: rect.top, bottom: rect.bottom });
  }

  return extractDropPosition({ clientY: e.clientY, items });
}

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
