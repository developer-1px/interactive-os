/**
 * MouseListener — DOM Adapter for mouse events.
 *
 * Pipeline: MouseEvent → sense (DOM) → resolve (pure) → dispatch
 *
 * W3C UI Events Module: Mouse Events (§3.4)
 *
 * Two event phases:
 *   mousedown → focus + select (immediate visual feedback)
 *   click     → activate / edit mode transitions
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
import { OS_FIELD_START_EDIT } from "../../3-commands/field/startEdit";
import { FieldRegistry } from "../../6-components/field/FieldRegistry";

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
// Click Sense: DOM → { clickedEl, clickedItemId }
// ═══════════════════════════════════════════════════════════════════

interface ClickSense {
  clickedEl: HTMLElement | null;
  clickedItemId: string | null;
  activeZoneId: string;
  zone: ReturnType<typeof os.getState>["os"]["focus"]["zones"][string] | undefined;
  entry: ReturnType<typeof ZoneRegistry.get>;
}

function senseClick(target: HTMLElement): ClickSense | null {
  if (target.closest("[data-inspector]")) return null;
  if (target.closest("[data-expand-trigger]") || target.closest("[data-check-trigger]")) return null;

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

/**
 * Convert click coordinates to text offset and seed FieldRegistry.
 * useFieldFocus will pick up the offset and set the DOM caret.
 */
function seedCaretFromPoint(x: number, y: number, fieldId: string) {
  const range = document.caretRangeFromPoint(x, y);
  if (!range) return;

  const el = document.getElementById(fieldId);
  if (!el) return;

  // Compute offset: create a range from element start to click point
  const preCaretRange = document.createRange();
  preCaretRange.selectNodeContents(el);
  preCaretRange.setEnd(range.startContainer, range.startOffset);
  const offset = preCaretRange.toString().length;

  FieldRegistry.updateCaretPosition(fieldId, offset);
}

// ═══════════════════════════════════════════════════════════════════
// SELECT Mode Click: resolveClick (activate on re-click)
// ═══════════════════════════════════════════════════════════════════

function handleSelectModeClick(
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
// Component
// ═══════════════════════════════════════════════════════════════════

export function MouseListener() {
  useEffect(() => {
    /** Pre-mousedown focusedItemId — for re-click detection */
    let preClickFocusedItemId: string | null = null;
    /** Mousedown coordinates — for I-beam positioning */
    let lastMouseDownX = 0;
    let lastMouseDownY = 0;

    // ── Mousedown: focus + select + EDIT→EDIT transition ──
    const onMouseDown = (e: Event) => {
      const me = e as MouseEvent;
      const input = senseMouseDown(me);
      if (!input) return;

      // Snapshot state BEFORE dispatching
      const focusState = os.getState().os.focus;
      const activeZoneId = focusState.activeZoneId;
      preClickFocusedItemId = activeZoneId
        ? focusState.zones[activeZoneId]?.focusedItemId ?? null
        : null;
      const editingItemId = activeZoneId
        ? focusState.zones[activeZoneId]?.editingItemId ?? null
        : null;
      lastMouseDownX = me.clientX;
      lastMouseDownY = me.clientY;

      // Determine click target for EDIT mode decision
      const clickedItemId = input.targetItemId;

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

        // EDIT→EDIT: if was editing and clicked a different Field item,
        // start editing it immediately (atomic: A → B, no null).
        if (
          editingItemId &&
          clickedItemId &&
          clickedItemId !== editingItemId &&
          FieldRegistry.getField(clickedItemId)
        ) {
          os.dispatch(OS_FIELD_START_EDIT(), {
            meta: { input: { type: "MOUSE", key: "mousedown", elementId: clickedItemId } },
          });
          // Seed caret offset from click position (overrides ZoneState seed)
          seedCaretFromPoint(lastMouseDownX, lastMouseDownY, clickedItemId);
        }

        setDispatching(false);
      }

      if (result.preventDefault) {
        me.preventDefault();
      }
    };

    // ── Click: re-click activation (SELECT→EDIT) ──
    const onClick = (e: Event) => {
      const target = (e as MouseEvent).target as HTMLElement;
      if (!target) return;

      const sense = senseClick(target);
      if (!sense) return;

      handleSelectModeClick(sense, preClickFocusedItemId);
    };

    document.addEventListener("mousedown", onMouseDown, { capture: true });
    document.addEventListener("click", onClick, { capture: true });

    return () => {
      document.removeEventListener("mousedown", onMouseDown, { capture: true });
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  return null;
}

MouseListener.displayName = "MouseListener";
