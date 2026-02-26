/**
 * Shared DOM sense functions for mouse-like interactions.
 *
 * These functions read DOM state and produce typed inputs
 * for pure resolve functions. No side effects, no dispatch.
 *
 * Used by: PointerListener (and headless simulateClick)
 */

import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { FieldRegistry } from "../../6-components/field/FieldRegistry";
import { os } from "../../kernel";
import { sensorGuard } from "../../lib/loopGuard";
import { resolveClick } from "../mouse/resolveClick";
import type { MouseInput } from "../mouse/resolveMouse";
import {
  findFocusableItem,
  resolveFocusTarget,
  setDispatching,
} from "../shared";

// ═══════════════════════════════════════════════════════════════════
// Sense: DOM → MouseInput
// ═══════════════════════════════════════════════════════════════════

export function senseMouseDown(
  target: HTMLElement,
  e: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean; altKey: boolean },
): MouseInput | null {
  if (!target) return null;

  // Guard: inspector, loop guard
  if (target.closest("[data-inspector]") || !sensorGuard.check()) return null;

  // Label detection
  const label = target.closest("[data-label]") as HTMLElement | null;
  if (label) {
    const targetId = label.getAttribute("data-for");
    const targetField = targetId
      ? document.getElementById(targetId)
      : (label.querySelector('[role="textbox"]') as HTMLElement | null);

    if (targetField) {
      const fieldTarget = resolveFocusTarget(targetField);
      if (fieldTarget) {
        return {
          targetItemId: null,
          targetGroupId: null,
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          isLabel: true,
          labelTargetItemId: fieldTarget.itemId,
          labelTargetGroupId: fieldTarget.groupId,
          hasAriaExpanded: false,
          itemRole: null,
        };
      }
    }
    return null;
  }

  // Normal item detection
  const item = findFocusableItem(target);
  if (!item) {
    // Zone-only click: no item, but zone exists → activate zone
    const zoneEl = target.closest("[data-zone]") as HTMLElement | null;
    const zoneId = zoneEl?.getAttribute("data-zone");
    if (!zoneId) return null;

    return {
      targetItemId: null,
      targetGroupId: zoneId,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      isLabel: false,
      labelTargetItemId: null,
      labelTargetGroupId: null,
      hasAriaExpanded: false,
      itemRole: null,
    };
  }
  const focusTarget = resolveFocusTarget(item);
  if (!focusTarget) return null;

  return {
    targetItemId: focusTarget.itemId,
    targetGroupId: focusTarget.groupId,
    shiftKey: e.shiftKey,
    metaKey: e.metaKey,
    ctrlKey: e.ctrlKey,
    altKey: e.altKey,
    isLabel: false,
    labelTargetItemId: null,
    labelTargetGroupId: null,
    hasAriaExpanded: item.hasAttribute("aria-expanded"),
    itemRole: item.getAttribute("role"),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Click Sense: DOM → ClickSense
// ═══════════════════════════════════════════════════════════════════

export interface ClickSense {
  clickedEl: HTMLElement | null;
  clickedItemId: string | null;
  activeZoneId: string;
  zone:
    | ReturnType<typeof os.getState>["os"]["focus"]["zones"][string]
    | undefined;
  entry: ReturnType<typeof ZoneRegistry.get>;
}

export function senseClick(target: HTMLElement): ClickSense | null {
  if (target.closest("[data-inspector]")) return null;
  if (
    target.closest("[data-expand-trigger]") ||
    target.closest("[data-check-trigger]")
  )
    return null;

  const state = os.getState();
  const { activeZoneId } = state.os.focus;
  if (!activeZoneId) return null;

  const clickedEl = findFocusableItem(target);
  return {
    clickedEl,
    clickedItemId: clickedEl?.getAttribute("data-item-id") ?? null,
    activeZoneId,
    zone: state.os.focus.zones[activeZoneId],
    entry: ZoneRegistry.get(activeZoneId),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Caret Seeding: click coordinates → FieldRegistry offset
// ═══════════════════════════════════════════════════════════════════

export function seedCaretFromPoint(x: number, y: number, fieldId: string) {
  const range = document.caretRangeFromPoint(x, y);
  if (!range) return;

  const el = document.getElementById(fieldId);
  if (!el) return;

  const preCaretRange = document.createRange();
  preCaretRange.selectNodeContents(el);
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  const offset = preCaretRange.toString().length;

  FieldRegistry.updateCaretPosition(fieldId, offset);
}

// ═══════════════════════════════════════════════════════════════════
// Click Mode Handler: resolveClick → dispatch
// ═══════════════════════════════════════════════════════════════════

export function handleSelectModeClick(
  sense: ClickSense,
  preClickFocusedItemId: string | null,
) {
  const { entry, clickedEl, clickedItemId, zone } = sense;

  const activateOnClick = entry?.config?.activate?.onClick ?? false;
  const isCurrentPage = clickedEl?.getAttribute("aria-current") === "page";
  const reClickOnly = entry?.config?.activate?.reClickOnly ?? false;

  const result = resolveClick({
    activateOnClick,
    clickedItemId,
    focusedItemId: reClickOnly
      ? preClickFocusedItemId
      : (zone?.focusedItemId ?? null),
    isCurrentPage,
  });

  if (result.commands.length > 0) {
    setDispatching(true);
    for (const cmd of result.commands) {
      const opts = result.meta
        ? { meta: { ...result.meta, pipeline: { sensed: {}, resolved: {} } } }
        : undefined;
      os.dispatch(cmd, opts);
    }
    setDispatching(false);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Drag: Drop Position Detection
// ═══════════════════════════════════════════════════════════════════

export function getDropPosition(
  e: { clientY: number },
  zoneEl: HTMLElement,
): { overItemId: string; position: "before" | "after" } | null {
  const items = zoneEl.querySelectorAll("[data-item-id]");
  for (const item of items) {
    if (item.closest("[data-zone]") !== zoneEl) continue;
    const rect = item.getBoundingClientRect();
    if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
      const mid = rect.top + rect.height / 2;
      const itemId =
        item.getAttribute("data-item-id") || (item as HTMLElement).id;
      if (!itemId) continue;
      return {
        overItemId: itemId,
        position: e.clientY < mid ? "before" : "after",
      };
    }
  }
  return null;
}
