/**
 * PointerListener — Unified Pointer Events → Kernel Commands.
 *
 * Gesture Recognizer pattern: "Same finger, same listener."
 *
 * Replaces both MouseListener (mousedown/click) and DragListener (pointer*)
 * by using pointer events exclusively to discriminate CLICK vs DRAG.
 *
 * State Machine: IDLE → PENDING → (CLICK | DRAG) → IDLE
 *
 * Pipeline: PointerEvent → sense (DOM) → resolve (pure) → dispatch
 *
 * @see docs/1-project/unified-pointer-listener/spec.md
 * @see resolvePointer.ts — pure gesture recognition logic
 */

import { useEffect } from "react";
import { ZoneRegistry } from "../../2-contexts/zoneRegistry";
import {
  OS_DRAG_END,
  OS_DRAG_OVER,
  OS_DRAG_START,
} from "../../3-commands/drag";
import { OS_EXPAND } from "../../3-commands/expand";
import { OS_CHECK } from "../../3-commands/interaction/check";
import { OS_FOCUS } from "../../3-commands";
import { OS_ESCAPE } from "../../3-commands/dismiss/escape";
import { OS_FIELD_START_EDIT } from "../../3-commands/field/startEdit";
import { FieldRegistry } from "../../6-components/field/FieldRegistry";
import { os } from "../../kernel";
import { resolveClick } from "../mouse/resolveClick";
import { resolveMouse } from "../mouse/resolveMouse";
import { findFocusableItem, setDispatching } from "../shared";
import {
  getDropPosition,
  senseMouseDown,
} from "../shared/senseMouse";
import {
  createIdleState,
  type GestureState,
  resolvePointerDown,
  resolvePointerMove,
  resolvePointerUp,
} from "./resolvePointer";

export function PointerListener() {
  useEffect(() => {
    let gestureState: GestureState = createIdleState();
    let preClickFocusedItemId: string | null = null;
    let lastPointerDownX = 0;
    let lastPointerDownY = 0;
    let pointerDownTarget: HTMLElement | null = null;

    // ── Pointerdown: gesture start + immediate focus/select ──
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const hasDragHandle = !!target.closest("[data-drag-handle]");
      const itemEl = findFocusableItem(target);
      const zoneEl = target.closest("[data-zone]") as HTMLElement | null;
      const itemId = itemEl?.getAttribute("data-item-id") ?? itemEl?.id ?? null;
      const zoneId = zoneEl?.getAttribute("data-zone") ?? null;

      gestureState = resolvePointerDown(gestureState, {
        clientX: e.clientX,
        clientY: e.clientY,
        button: e.button,
        hasDragHandle,
        hasItemId: !!itemId,
        hasZone: !!zoneId,
        itemId,
        zoneId,
      });

      if (gestureState.phase !== "PENDING") return;

      pointerDownTarget = target;
      lastPointerDownX = e.clientX;
      lastPointerDownY = e.clientY;

      // Snapshot pre-click state
      const focusState = os.getState().os.focus;
      const activeZoneId = focusState.activeZoneId;
      preClickFocusedItemId = activeZoneId
        ? (focusState.zones[activeZoneId]?.focusedItemId ?? null)
        : null;

      // Immediate focus+select (mousedown equivalent)
      const mouseInput = senseMouseDown(target, e);
      if (!mouseInput) {
        // ── outsideClick dismiss ──
        // Click landed outside any zone/item. If the active zone
        // has dismiss.outsideClick === "close", dispatch OS_ESCAPE.
        if (activeZoneId) {
          const zoneEntry = ZoneRegistry.get(activeZoneId);
          if (zoneEntry?.config.dismiss.outsideClick === "close") {
            os.dispatch(OS_ESCAPE({}));
          }
        }
        return;
      }

      const editingItemId = activeZoneId
        ? (focusState.zones[activeZoneId]?.editingItemId ?? null)
        : null;
      const result = resolveMouse(mouseInput);

      if (result.commands.length > 0) {
        setDispatching(true);
        for (const cmd of result.commands) {
          const opts = result.meta
            ? {
              meta: {
                ...result.meta,
                pipeline: {
                  sensed: mouseInput,
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

        // EDIT→EDIT transition
        const clickedItemId = mouseInput.targetItemId;
        if (
          editingItemId &&
          clickedItemId &&
          clickedItemId !== editingItemId &&
          FieldRegistry.getField(clickedItemId)
        ) {
          os.dispatch(OS_FIELD_START_EDIT(), {
            meta: {
              input: {
                type: "MOUSE",
                key: "pointerdown",
                elementId: clickedItemId,
              },
            },
          });
          // Inline seedCaretFromPoint — DOM side effect, not sense
          const caretRange = document.caretRangeFromPoint(
            lastPointerDownX,
            lastPointerDownY,
          );
          if (caretRange) {
            const fieldEl = document.getElementById(clickedItemId);
            if (fieldEl) {
              const preCaretRange = document.createRange();
              preCaretRange.selectNodeContents(fieldEl);
              preCaretRange.setEnd(
                caretRange.startContainer,
                caretRange.startOffset,
              );
              const offset = preCaretRange.toString().length;
              FieldRegistry.updateCaretPosition(clickedItemId, offset);
            }
          }
        }

        setDispatching(false);
      }

      if (result.preventDefault) e.preventDefault();
    };

    // ── Pointermove: CLICK vs DRAG discrimination ──
    const onPointerMove = (e: PointerEvent) => {
      const prevPhase = gestureState.phase;
      gestureState = resolvePointerMove(gestureState, {
        clientX: e.clientX,
        clientY: e.clientY,
      });

      // Just entered DRAG mode
      if (prevPhase === "PENDING" && gestureState.phase === "DRAG") {
        os.dispatch(
          OS_DRAG_START({
            zoneId: gestureState.zoneId!,
            itemId: gestureState.itemId!,
          }),
        );
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
      }

      // Ongoing DRAG — update hover target
      if (gestureState.phase === "DRAG") {
        const zoneEl = document.querySelector(
          `[data-zone="${gestureState.zoneId}"]`,
        ) as HTMLElement | null;
        if (!zoneEl) return;

        const drop = getDropPosition(e, zoneEl);
        os.dispatch(
          drop
            ? OS_DRAG_OVER({
              overItemId: drop.overItemId,
              position: drop.position,
            })
            : OS_DRAG_OVER({ overItemId: null, position: null }),
        );
      }
    };

    // ── Pointerup: complete gesture ──
    const onPointerUp = (e: PointerEvent) => {
      const result = resolvePointerUp(gestureState);
      gestureState = result.state;

      if (result.gesture === "CLICK") {
        const target = pointerDownTarget ?? (e.target as HTMLElement);
        if (target) {
          // Inspector: skip entirely
          if (target.closest("[data-inspector]")) {
            // no-op
          } else if (target.closest("[data-expand-trigger]") || target.closest("[data-check-trigger]")) {
            // Sub-item triggers: OS handles expand/check via pipeline
            const state = os.getState();
            const { activeZoneId } = state.os.focus;
            if (activeZoneId) {
              const itemEl = findFocusableItem(target);
              const itemId = itemEl?.getAttribute("data-item-id") ?? null;
              if (itemId) {
                os.dispatch(OS_FOCUS({ zoneId: activeZoneId, itemId, skipSelection: true }));
                if (target.closest("[data-expand-trigger]")) {
                  os.dispatch(OS_EXPAND({ itemId, zoneId: activeZoneId }));
                } else {
                  os.dispatch(OS_CHECK({ targetId: itemId }));
                }
              }
            }
          } else {
            const state = os.getState();
            const { activeZoneId } = state.os.focus;

            if (activeZoneId) {
              const clickedEl = findFocusableItem(target);
              const clickedItemId =
                clickedEl?.getAttribute("data-item-id") ?? null;
              const zone = state.os.focus.zones[activeZoneId];
              const entry = ZoneRegistry.get(activeZoneId);

              const activateOnClick =
                entry?.config?.activate?.onClick ?? false;
              const isCurrentPage =
                clickedEl?.getAttribute("aria-current") === "page";
              const reClickOnly =
                entry?.config?.activate?.reClickOnly ?? false;

              const clickResult = resolveClick({
                activateOnClick,
                clickedItemId,
                focusedItemId: reClickOnly
                  ? preClickFocusedItemId
                  : (zone?.focusedItemId ?? null),
                isCurrentPage,
              });

              if (clickResult.commands.length > 0) {
                setDispatching(true);
                for (const cmd of clickResult.commands) {
                  const opts = clickResult.meta
                    ? {
                      meta: {
                        ...clickResult.meta,
                        pipeline: { sensed: {}, resolved: {} },
                      },
                    }
                    : undefined;
                  os.dispatch(cmd, opts);
                }
                setDispatching(false);
              }
            }
          }
        }
      } else if (result.gesture === "DRAG_END") {
        os.dispatch(OS_DRAG_END());
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }

      pointerDownTarget = null;
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return null;
}

PointerListener.displayName = "PointerListener";
