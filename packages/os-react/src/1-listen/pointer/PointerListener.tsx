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

import {
  findFocusableItem,
  setDispatching,
} from "@os-core/1-listen/_shared/domQuery";
import {
  getDropPosition,
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
    let preClickFocusedItemId: string | null = null;
    let lastPointerDownX = 0;
    let lastPointerDownY = 0;
    let pointerDownTarget: HTMLElement | null = null;
    /** The slider Item element used for rect calculation during drag */
    let sliderEl: HTMLElement | null = null;

    // ── Pointerdown: gesture start + immediate focus/select ──
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const hasDragHandle = !!target.closest("[data-drag-handle]");
      const itemEl = findFocusableItem(target);
      const zoneEl = target.closest("[data-zone]") as HTMLElement | null;
      const itemId = itemEl?.getAttribute("data-item-id") ?? itemEl?.id ?? null;
      const zoneId = zoneEl?.getAttribute("data-zone") ?? null;

      // Detect slider zone
      const zoneEntry = zoneId ? ZoneRegistry.get(zoneId) : null;
      const isSlider = zoneEntry?.config?.value?.mode === "continuous";

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
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";

        // Immediate focus
        setDispatching(true);
        os.dispatch(
          OS_FOCUS({
            zoneId: zoneId!,
            itemId: itemId!,
            skipSelection: true,
          }),
        );

        // Set value from pointer position
        const valueConfig = zoneEntry!.config.value;
        const rect = itemEl.getBoundingClientRect();
        const newValue = resolveSliderValue({
          clientX: e.clientX,
          clientY: e.clientY,
          rect,
          min: valueConfig.min,
          max: valueConfig.max,
          step: valueConfig.step,
          orientation: "horizontal",
        });
        os.dispatch(
          OS_VALUE_CHANGE({
            action: "set",
            value: newValue,
            itemId: itemId!,
            zoneId: zoneId!,
          }),
        );
        setDispatching(false);
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
      preClickFocusedItemId = activeZoneId
        ? (focusState.zones[activeZoneId]?.focusedItemId ?? null)
        : null;

      // Immediate focus+select (mousedown equivalent)
      const mouseInput = senseMouseDown(target, e);
      if (!mouseInput) {
        // ── outsideClick dismiss ──
        // Click landed outside any zone/item. If the active zone
        // has dismiss.outsideClick === "close", dispatch OS_ESCAPE.
        // But skip if clicking a trigger (trigger handles its own toggle)
        const isTriggerClick = !!target.closest("[data-trigger-id]");
        if (activeZoneId && !isTriggerClick) {
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

    // ── Pointermove: CLICK vs DRAG discrimination + slider value ──
    const onPointerMove = (e: PointerEvent) => {
      // Slider drag: update value from pointer position
      if (gestureState.phase === "SLIDER_DRAG" && sliderEl) {
        const zoneId = gestureState.zoneId;
        const itemId = gestureState.itemId;
        if (zoneId && itemId) {
          const zoneEntry = ZoneRegistry.get(zoneId);
          const valueConfig = zoneEntry?.config?.value;
          if (valueConfig && valueConfig.mode === "continuous") {
            const rect = sliderEl.getBoundingClientRect();
            const newValue = resolveSliderValue({
              clientX: e.clientX,
              clientY: e.clientY,
              rect,
              min: valueConfig.min,
              max: valueConfig.max,
              step: valueConfig.step,
              orientation: "horizontal",
            });
            os.dispatch(
              OS_VALUE_CHANGE({
                action: "set",
                value: newValue,
                itemId,
                zoneId,
              }),
            );
          }
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
          }
          // ── Trigger-first: resolve trigger click before Item ──
          else if (target.closest("[data-trigger-id]")) {
            const triggerEl = target.closest(
              "[data-trigger-id]",
            ) as HTMLElement;
            const triggerId = triggerEl.getAttribute("data-trigger-id");
            if (triggerId) {
              const triggerMeta = ZoneRegistry.getTriggerOverlay(triggerId);
              if (triggerMeta) {
                const overlayStack = os.getState().os.overlays.stack;
                const isOpen = overlayStack.some(
                  (o: { id: string }) => o.id === triggerMeta.overlayId,
                );
                const triggerCmd = resolveTriggerClick({
                  triggerId,
                  triggerRole: triggerMeta.overlayType,
                  overlayId: triggerMeta.overlayId,
                  isTriggerOverlayOpen: isOpen,
                });
                if (triggerCmd) {
                  setDispatching(true);
                  os.dispatch(triggerCmd, {
                    meta: {
                      input: {
                        type: "MOUSE",
                        key: "click",
                        elementId: triggerId,
                      },
                    },
                  });
                  setDispatching(false);
                }
              }
            }
          } else if (
            target.closest("[data-expand-trigger]") ||
            target.closest("[data-check-trigger]")
          ) {
            // Sub-item triggers: OS handles expand/check via pipeline
            const state = os.getState();
            const { activeZoneId } = state.os.focus;
            if (activeZoneId) {
              const itemEl = findFocusableItem(target);
              const itemId = itemEl?.getAttribute("data-item-id") ?? null;
              if (itemId) {
                os.dispatch(
                  OS_FOCUS({
                    zoneId: activeZoneId,
                    itemId,
                    skipSelection: true,
                  }),
                );
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

              // inputmap["click"] — direct click→command routing from APG table
              const clickCommands = entry?.config?.inputmap?.["click"] ?? [];
              const activateOnClick = clickCommands.length > 0;
              const isCurrentPage =
                clickedEl?.getAttribute("aria-current") === "page";

              const clickResult = resolveClick({
                activateOnClick,
                clickedItemId,
                focusedItemId: zone?.focusedItemId ?? null,
                isCurrentPage,
                ...(clickCommands.length > 0
                  ? { actionCommands: clickCommands }
                  : {}),
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
      } else if (result.gesture === "SLIDER_DRAG_END") {
        // Slider drag complete — clean up styles
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
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
