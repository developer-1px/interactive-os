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

import type { BaseCommand } from "@kernel/core/tokens";
import {
  findFocusableItem,
  setDispatching,
} from "@os-core/1-listen/_shared/domQuery";
import {
  getDropPosition,
  senseClickTarget,
  senseMouseDown,
} from "@os-core/1-listen/_shared/senseMouse";
import { resolveClick } from "@os-core/1-listen/mouse/resolveClick";
import { resolveMouse } from "@os-core/1-listen/mouse/resolveMouse";
import { resolveTriggerClick } from "@os-core/1-listen/mouse/resolveTriggerClick";
import {
  createIdleState,
  type GestureState,
  resolvePointerDown,
  resolvePointerMove,
  resolvePointerUp,
  resolveSliderValue,
} from "@os-core/1-listen/pointer/resolvePointer";
import { OS_FOCUS } from "@os-core/4-command";
import { OS_CHECK } from "@os-core/4-command/activate/check";
import { OS_ESCAPE } from "@os-core/4-command/dismiss/escape";
import {
  OS_DRAG_END,
  OS_DRAG_OVER,
  OS_DRAG_START,
} from "@os-core/4-command/drag";
import { OS_EXPAND } from "@os-core/4-command/expand";
import { OS_FIELD_START_EDIT } from "@os-core/4-command/field/startEdit";
import { OS_VALUE_CHANGE } from "@os-core/4-command/valueChange";
import { os } from "@os-core/engine/kernel";
import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { useEffect } from "react";

export function PointerListener() {
  useEffect(() => {
    let gestureState: GestureState = createIdleState();
    let lastPointerDownX = 0;
    let lastPointerDownY = 0;
    let pointerDownTarget: HTMLElement | null = null;
    /** The slider Item element used for rect calculation during drag */
    let sliderEl: HTMLElement | null = null;

    // ── Local Helpers ──────────────────────────────────────────

    /** Dispatch multiple commands within a setDispatching guard. */
    const dispatchBatch = (commands: BaseCommand[], opts?: any) => {
      setDispatching(true);
      for (const cmd of commands) {
        os.dispatch(cmd, opts);
      }
      setDispatching(false);
    };

    const setDragCursor = () => {
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    };

    const clearDragCursor = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    /** Read slider config + rect, resolve value, dispatch OS_VALUE_CHANGE. */
    const dispatchSliderValue = (
      clientX: number,
      clientY: number,
      el: HTMLElement,
      zoneId: string,
      itemId: string,
    ) => {
      const zoneEntry = ZoneRegistry.get(zoneId);
      const valueConfig = zoneEntry?.config?.value;
      if (!valueConfig || valueConfig.mode !== "continuous") return;
      const rect = el.getBoundingClientRect();
      const newValue = resolveSliderValue({
        clientX,
        clientY,
        rect,
        min: valueConfig.min,
        max: valueConfig.max,
        step: valueConfig.step,
        orientation: "horizontal",
      });
      os.dispatch(
        OS_VALUE_CHANGE({ action: "set", value: newValue, itemId, zoneId }),
      );
    };

    // ── Pointerdown: gesture start + immediate focus/select ──
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const hasDragHandle = !!target.closest("[data-drag-handle]");
      const itemEl = findFocusableItem(target);
      const zoneEl = target.closest("[data-zone]") as HTMLElement | null;
      const itemId = itemEl?.id ?? null;
      const zoneId = zoneEl?.getAttribute("data-zone") ?? null;

      // Detect slider zone — only actual sliders support drag-based value change.
      // Spinbuttons, meters, and separators also have value.mode="continuous"
      // but use keyboard arrows for value changes, not pointer drag.
      const zoneEntry = zoneId ? ZoneRegistry.get(zoneId) : null;
      const isSlider =
        zoneEntry?.config?.value?.mode === "continuous" &&
        zoneEntry?.role === "slider";

      gestureState = resolvePointerDown(gestureState, {
        clientX: e.clientX,
        clientY: e.clientY,
        button: e.button,
        hasDragHandle,
        hasItemId: !!itemId,
        hasZone: !!zoneId,
        itemId,
        zoneId,
        isSlider,
      });

      // Slider: immediate drag — set up element ref + styles + first value
      if (gestureState.phase === "SLIDER_DRAG" && itemEl) {
        sliderEl = itemEl;
        setDragCursor();
        dispatchBatch([
          OS_FOCUS({
            zoneId: zoneId!,
            itemId: itemId!,
            skipSelection: true,
          }) as BaseCommand,
        ]);
        dispatchSliderValue(e.clientX, e.clientY, itemEl, zoneId!, itemId!);
        e.preventDefault();
        return;
      }

      if (gestureState.phase !== "PENDING") return;

      pointerDownTarget = target;
      lastPointerDownX = e.clientX;
      lastPointerDownY = e.clientY;

      // Snapshot pre-click state
      const focusState = os.getState().os.focus;
      const activeZoneId = focusState.activeZoneId;

      // Immediate focus+select (mousedown equivalent)
      const mouseInput = senseMouseDown(target, e);
      if (!mouseInput) {
        // ── outsideClick dismiss ──
        const isTriggerClick = !!target.closest("[data-trigger-id]");
        if (activeZoneId && !isTriggerClick) {
          const entry = ZoneRegistry.get(activeZoneId);
          if (entry?.config.dismiss.outsideClick === "close") {
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

    // ── Pointermove: CLICK vs DRAG discrimination + slider value ──
    const onPointerMove = (e: PointerEvent) => {
      // Slider drag: update value from pointer position
      if (gestureState.phase === "SLIDER_DRAG" && sliderEl) {
        const { zoneId, itemId } = gestureState;
        if (zoneId && itemId) {
          dispatchSliderValue(e.clientX, e.clientY, sliderEl, zoneId, itemId);
        }
        e.preventDefault();
        return;
      }

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
        setDragCursor();
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

    // ── Pointerup: complete gesture ──────────────────────────────
    const onPointerUp = (e: PointerEvent) => {
      const result = resolvePointerUp(gestureState);
      gestureState = result.state;

      if (result.gesture === "CLICK") {
        const target = pointerDownTarget ?? (e.target as HTMLElement);
        if (target) {
          const clickTarget = senseClickTarget(target);

          switch (clickTarget.type) {
            case "trigger": {
              const triggerCmd = resolveTriggerClick({
                triggerId: clickTarget.triggerId,
                triggerRole: clickTarget.overlayType,
                overlayId: clickTarget.overlayId,
                isTriggerOverlayOpen: clickTarget.isOpen,
              });
              if (triggerCmd) {
                dispatchBatch([triggerCmd], {
                  meta: {
                    input: {
                      type: "MOUSE",
                      key: "click",
                      elementId: clickTarget.triggerId,
                    },
                  },
                });
              }
              break;
            }

            case "simple-trigger": {
              const cb = ZoneRegistry.findItemCallback(clickTarget.triggerId);
              if (cb?.onActivate) {
                const state = os.getState();
                const { activeZoneId } = state.os.focus;
                const zone = activeZoneId
                  ? state.os.focus.zones[activeZoneId]
                  : undefined;
                const focusId = zone?.focusedItemId ?? "";
                // Payload from data-trigger-payload takes precedence (trigger ≠ focus)
                const target = clickTarget.payload ?? focusId;
                const cmd =
                  typeof cb.onActivate === "function"
                    ? cb.onActivate(target)
                    : cb.onActivate;
                dispatchBatch([cmd], {
                  meta: {
                    input: {
                      type: "MOUSE",
                      key: "click",
                      elementId: clickTarget.triggerId,
                    },
                  },
                });
              }
              break;
            }

            case "expand":
            case "check": {
              os.dispatch(
                OS_FOCUS({
                  zoneId: clickTarget.zoneId,
                  itemId: clickTarget.itemId,
                  skipSelection: true,
                }),
              );
              os.dispatch(
                clickTarget.type === "expand"
                  ? OS_EXPAND({
                      itemId: clickTarget.itemId,
                      zoneId: clickTarget.zoneId,
                    })
                  : OS_CHECK({ targetId: clickTarget.itemId }),
              );
              break;
            }

            case "item": {
              const state = os.getState();
              const { activeZoneId } = state.os.focus;
              if (activeZoneId) {
                const zone = state.os.focus.zones[activeZoneId];
                const entry = ZoneRegistry.get(activeZoneId);
                const clickCommands = entry?.config?.inputmap?.["click"] ?? [];

                const clickResult = resolveClick({
                  activateOnClick: clickCommands.length > 0,
                  clickedItemId: clickTarget.itemId,
                  focusedItemId: zone?.focusedItemId ?? null,
                  isCurrentPage: clickTarget.isCurrentPage,
                  ...(clickCommands.length > 0
                    ? { actionCommands: clickCommands }
                    : {}),
                });

                if (clickResult.commands.length > 0) {
                  const opts = clickResult.meta
                    ? {
                        meta: {
                          ...clickResult.meta,
                          pipeline: { sensed: {}, resolved: {} },
                        },
                      }
                    : undefined;
                  dispatchBatch(clickResult.commands, opts);
                }
              }
              break;
            }

            case "none":
              break;
          }
        }
      } else if (result.gesture === "DRAG_END") {
        os.dispatch(OS_DRAG_END());
        clearDragCursor();
      } else if (result.gesture === "SLIDER_DRAG_END") {
        clearDragCursor();
        sliderEl = null;
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
