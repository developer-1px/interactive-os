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
import { kernel } from "../../kernel";
import { useEffect } from "react";
import { sensorGuard } from "../../lib/loopGuard";
import { resolveMouse, type MouseInput } from "./resolveMouse";

// ═══════════════════════════════════════════════════════════════════
// DOM Query Utilities (Sense)
// ═══════════════════════════════════════════════════════════════════

const findFocusableItem = (el: HTMLElement) =>
    el.closest("[data-item-id]") as HTMLElement | null;

interface FocusTargetInfo {
    itemId: string;
    itemEl: HTMLElement;
    groupId: string;
}

function resolveFocusTarget(target: HTMLElement): FocusTargetInfo | null {
    const itemEl = findFocusableItem(target);
    if (!itemEl?.id) return null;

    const zoneEl = itemEl.closest("[data-focus-group]") as HTMLElement | null;
    const groupId = zoneEl?.getAttribute("data-focus-group") ?? null;
    if (!groupId) return null;

    return { itemId: itemEl.id, itemEl, groupId };
}

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
    if (!item) return null;
    const focusTarget = resolveFocusTarget(item);
    if (!focusTarget) return null;

    return {
        targetItemId: focusTarget.itemId,
        targetGroupId: focusTarget.groupId,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        isLabel: false,
        labelTargetItemId: null,
        labelTargetGroupId: null,
        hasAriaExpanded: item.hasAttribute("aria-expanded"),
        itemRole: item.getAttribute("role"),
    };
}

// ═══════════════════════════════════════════════════════════════════
// Re-entrance Guard (shared with FocusListener)
// ═══════════════════════════════════════════════════════════════════

let isDispatching = false;

export function setMouseDispatching(value: boolean) {
    isDispatching = value;
}

export function getMouseDispatching(): boolean {
    return isDispatching;
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

                case "label-redirect": {
                    me.preventDefault();
                    isDispatching = true;
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
                    isDispatching = false;
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
                    isDispatching = true;
                    kernel.dispatch(
                        FOCUS({ zoneId: result.groupId, itemId: result.itemId }),
                        mouseMeta,
                    );
                    isDispatching = false;

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
            document.removeEventListener("mousedown", onMouseDown, { capture: true });
    }, []);

    return null;
}

MouseListener.displayName = "MouseListener";
