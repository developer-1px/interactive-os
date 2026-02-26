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
import {
  OS_DRAG_END,
  OS_DRAG_OVER,
  OS_DRAG_START,
} from "../../3-commands/drag";
import { OS_FIELD_START_EDIT } from "../../3-commands/field/startEdit";
import { FieldRegistry } from "../../6-components/field/FieldRegistry";
import { os } from "../../kernel";
import { resolveMouse } from "../mouse/resolveMouse";
import { findFocusableItem, setDispatching } from "../shared";
import {
  getDropPosition,
  handleSelectModeClick,
  seedCaretFromPoint,
  senseClick,
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
      if (!mouseInput) return;

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
          seedCaretFromPoint(lastPointerDownX, lastPointerDownY, clickedItemId);
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
          const sense = senseClick(target);
          if (sense) handleSelectModeClick(sense, preClickFocusedItemId);
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
