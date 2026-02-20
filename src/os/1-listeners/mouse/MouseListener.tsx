/**
 * MouseListener — DOM Adapter for mouse events (mousedown).
 *
 * Pipeline: MouseEvent → sense (DOM) → resolveMouse (pure) → dispatch
 *
 * W3C UI Events Module: Mouse Events (§3.4)
 *
 * Handles: mousedown → OS_FOCUS + OS_SELECT + optional OS_EXPAND
 */


import { useEffect } from "react";
import { os } from "../../kernel";
import { sensorGuard } from "../../lib/loopGuard";
import {
  findFocusableItem,
  resolveFocusTarget,
  setDispatching,
} from "../shared";
import { type MouseInput, resolveMouse } from "./resolveMouse";

// ═══════════════════════════════════════════════════════════════════
// Sense: DOM → MouseInput
// ═══════════════════════════════════════════════════════════════════

function senseMouseDown(e: MouseEvent): MouseInput | null {
  const target = e.target as HTMLElement;
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
    const zoneEl = target.closest("[data-focus-group]") as HTMLElement | null;
    const zoneId = zoneEl?.getAttribute("data-focus-group");
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
// Component
// ═══════════════════════════════════════════════════════════════════

export function MouseListener() {
  useEffect(() => {
    const onMouseDown = (e: Event) => {
      const me = e as MouseEvent;
      const input = senseMouseDown(me);
      if (!input) return;

      const result = resolveMouse(input);

      if (result.commands.length > 0) {
        setDispatching(true);
        for (const cmd of result.commands) {
          const opts = result.meta ? { meta: result.meta } : undefined;
          os.dispatch(cmd, opts);
        }
        setDispatching(false);
      }

      if (result.preventDefault) {
        me.preventDefault();
      }
    };

    document.addEventListener("mousedown", onMouseDown, { capture: true });
    return () =>
      document.removeEventListener("mousedown", onMouseDown, {
        capture: true,
      });
  }, []);

  return null;
}

MouseListener.displayName = "MouseListener";
