/**
 * DragListener — Pointer Events → Kernel Commands.
 *
 * Detects drag gestures on [data-item-id] elements within [data-zone] containers.
 * Dispatches OS_DRAG_START/OVER/END commands to the kernel.
 *
 * Drag starts after pointer moves beyond a 5px threshold.
 * During drag, tracks which item the pointer is over and the drop position.
 */

import { useEffect, useRef } from "react";
import { os } from "@os/kernel";
import { OS_DRAG_START, OS_DRAG_OVER, OS_DRAG_END } from "@os/3-commands/drag";

const DRAG_THRESHOLD = 5; // px

export function DragListener() {
    const dragRef = useRef<{
        startX: number;
        startY: number;
        itemId: string;
        zoneId: string;
        started: boolean;
    } | null>(null);

    useEffect(() => {
        function findItemAndZone(target: EventTarget | null) {
            if (!(target instanceof HTMLElement)) return null;
            const itemEl = target.closest("[data-item-id]") as HTMLElement | null;
            if (!itemEl) return null;
            const zoneEl = itemEl.closest("[data-zone]") as HTMLElement | null;
            if (!zoneEl) return null;
            const itemId = itemEl.getAttribute("data-item-id") || itemEl.id;
            const zoneId = zoneEl.getAttribute("data-zone");
            if (!itemId || !zoneId) return null;
            return { itemId, zoneId, itemEl, zoneEl };
        }

        function getDropPosition(
            e: PointerEvent,
            zoneEl: HTMLElement,
        ): { overItemId: string; position: "before" | "after" } | null {
            const items = zoneEl.querySelectorAll("[data-item-id]");
            for (const item of items) {
                // Only direct children of this zone
                if (item.closest("[data-zone]") !== zoneEl) continue;
                const rect = item.getBoundingClientRect();
                if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    const mid = rect.top + rect.height / 2;
                    const itemId = item.getAttribute("data-item-id") || (item as HTMLElement).id;
                    if (!itemId) continue;
                    return {
                        overItemId: itemId,
                        position: e.clientY < mid ? "before" : "after",
                    };
                }
            }
            return null;
        }

        function onPointerDown(e: PointerEvent) {
            // Only left mouse button
            if (e.button !== 0) return;

            // Only start drag from drag handles
            const target = e.target as HTMLElement;
            const handle = target.closest("[data-drag-handle]") as HTMLElement | null;
            if (!handle) return;

            const info = findItemAndZone(handle);
            if (!info) return;

            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                itemId: info.itemId,
                zoneId: info.zoneId,
                started: false,
            };
        }

        function onPointerMove(e: PointerEvent) {
            const drag = dragRef.current;
            if (!drag) return;

            if (!drag.started) {
                const dx = e.clientX - drag.startX;
                const dy = e.clientY - drag.startY;
                if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

                // Start drag
                drag.started = true;
                os.dispatch(OS_DRAG_START({ zoneId: drag.zoneId, itemId: drag.itemId }));
                document.body.style.cursor = "grabbing";
                document.body.style.userSelect = "none";
            }

            // Update hover target
            const zoneEl = document.querySelector(`[data-zone="${drag.zoneId}"]`) as HTMLElement | null;
            if (!zoneEl) return;

            const drop = getDropPosition(e, zoneEl);
            if (drop) {
                os.dispatch(OS_DRAG_OVER({ overItemId: drop.overItemId, position: drop.position }));
            } else {
                os.dispatch(OS_DRAG_OVER({ overItemId: null, position: null }));
            }
        }

        function onPointerUp() {
            const drag = dragRef.current;
            if (!drag) return;
            dragRef.current = null;

            if (drag.started) {
                os.dispatch(OS_DRAG_END());
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            }
        }

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);

        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
        };
    }, []);

    return null;
}
