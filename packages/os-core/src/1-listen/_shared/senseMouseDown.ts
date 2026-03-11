/**
 * senseMouseDown — DOM → MouseInput for pointerdown path.
 *
 * Reads DOM attributes (data-item, data-zone, data-trigger-id, data-label)
 * and registry state to produce a typed MouseInput for resolve functions.
 *
 * Pipeline: PointerEvent target → senseMouseDown → resolveMouse/resolveClick → dispatch
 */

import { os } from "@os-core/engine/kernel";
import { TriggerOverlayRegistry } from "@os-core/engine/registries/triggerRegistry";
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
