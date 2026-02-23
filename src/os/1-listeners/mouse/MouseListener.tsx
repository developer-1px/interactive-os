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
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import { sensorGuard } from "../../lib/loopGuard";
import {
  findFocusableItem,
  resolveFocusTarget,
  setDispatching,
} from "../shared";
import { resolveClick } from "./resolveClick";
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
          const opts = result.meta
            ? {
              meta: {
                ...result.meta,
                pipeline: {
                  sensed: input,
                  resolved: {
                    preventDefault: result.preventDefault,
                    fallback: result.fallback,
                  },
                },
              },
            }
            : undefined;
          os.dispatch(cmd, opts);
        }
        setDispatching(false);
      }

      if (result.preventDefault) {
        me.preventDefault();
      }
    };

    document.addEventListener("mousedown", onMouseDown, { capture: true });

    // ── Click listener: activate.onClick (Navigation Tree) ──
    const onClick = (e: Event) => {
      const target = (e as MouseEvent).target as HTMLElement;
      if (!target || target.closest("[data-inspector]")) return;

      const state = os.getState();
      const { activeZoneId } = state.os.focus;
      if (!activeZoneId) return;

      const zone = state.os.focus.zones[activeZoneId];

      const entry = ZoneRegistry.get(activeZoneId);
      const activateOnClick = entry?.config?.activate?.onClick ?? false;

      const result = resolveClick({
        activateOnClick,
        focusedItemId: zone?.focusedItemId ?? null,
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
    };

    document.addEventListener("click", onClick, { capture: true });

    return () => {
      document.removeEventListener("mousedown", onMouseDown, { capture: true });
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return null;
}

MouseListener.displayName = "MouseListener";
