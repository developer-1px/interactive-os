/**
 * Shared DOM sense functions for mouse-like interactions.
 *
 * These functions read DOM state and produce typed inputs
 * for pure resolve functions. No side effects, no dispatch.
 *
 * Used by: PointerListener (and headless simulateClick)
 */

import type { MouseInput } from "../mouse/resolveMouse";
import {
  findFocusableItem,
  resolveFocusTarget,
} from "../shared";

// ═══════════════════════════════════════════════════════════════════
// Pure Interface: MouseDownSense
// ═══════════════════════════════════════════════════════════════════

export interface MouseDownSense {
  isInspector: boolean;
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
  // Guard: inspector
  if (input.isInspector) return null;

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

  // Read DOM → build MouseDownSense
  const isInspector = !!target.closest("[data-inspector]");

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
  const zoneEl = !isLabel && !item
    ? (target.closest("[data-zone]") as HTMLElement | null)
    : null;
  const zoneId = zoneEl?.getAttribute("data-zone") ?? null;

  return extractMouseInput({
    isInspector,
    isLabel,
    labelTargetItemId,
    labelTargetGroupId,
    itemId,
    groupId,
    hasAriaExpanded,
    itemRole,
    zoneId,
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
  const nodeList = zoneEl.querySelectorAll("[data-item-id]");
  const items: DropSenseInput["items"] = [];

  for (const node of nodeList) {
    if (node.closest("[data-zone]") !== zoneEl) continue;
    const rect = node.getBoundingClientRect();
    const itemId =
      node.getAttribute("data-item-id") || (node as HTMLElement).id;
    if (!itemId) continue;
    items.push({ itemId, top: rect.top, bottom: rect.bottom });
  }

  return extractDropPosition({ clientY: e.clientY, items });
}

