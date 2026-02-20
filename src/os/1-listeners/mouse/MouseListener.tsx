/**
 * MouseListener — DOM Adapter for mouse events (mousedown).
 *
 * Pipeline: MouseEvent → sense (DOM) → resolveMouse (pure) → dispatch
 *
 * W3C UI Events Module: Mouse Events (§3.4)
 *
 * Handles: mousedown → FOCUS + SELECT + optional EXPAND
 */

import { ACTIVATE, FOCUS, SELECT } from "@os/3-commands";
import { useEffect } from "react";
import { kernel } from "../../kernel";
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

      switch (result.action) {
        case "ignore":
          return;

        case "zone-activate": {
          setDispatching(true);
          kernel.dispatch(FOCUS({ zoneId: result.groupId, itemId: null }), {
            meta: {
              input: {
                type: "MOUSE",
                key: me.type,
                elementId: null,
              },
            },
          });
          setDispatching(false);
          return;
        }

        case "label-redirect": {
          me.preventDefault();
          setDispatching(true);
          kernel.dispatch(
            FOCUS({ zoneId: result.groupId, itemId: result.itemId }),
            {
              meta: {
                input: {
                  type: "MOUSE",
                  key: me.type,
                  elementId: result.itemId,
                },
              },
            },
          );
          setDispatching(false);
          return;
        }

        case "focus-and-select": {
          const mouseMeta = {
            meta: {
              input: {
                type: "MOUSE",
                key: me.type,
                elementId: result.itemId,
              },
            },
          };

          // FOCUS first
          setDispatching(true);
          kernel.dispatch(
            FOCUS({
              zoneId: result.groupId,
              itemId: result.itemId,
              skipSelection: true,
            }),
            mouseMeta,
          );
          setDispatching(false);

          // SELECT
          if (result.selectMode === "range" || result.selectMode === "toggle") {
            me.preventDefault();
          }
          kernel.dispatch(
            SELECT({ targetId: result.itemId, mode: result.selectMode }),
            mouseMeta,
          );

          // EXPAND if applicable
          if (result.shouldExpand) {
            kernel.dispatch(ACTIVATE(), mouseMeta);
          }
          return;
        }
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
