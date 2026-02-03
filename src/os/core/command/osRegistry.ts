import { OS_COMMANDS } from "@os/core/command/osCommands";
import { useFocusStore } from "@os/core/focus";
import { logger } from "@os/debug/logger";
import { findNextTarget } from "@os/core/navigation";
import type { Direction } from "@os/core/navigation";

/**
 * createOSRegistry:
 * Provides standard definitions for OS commands.
 * These act as "identity" commands that primarily trigger side effects
 * or standardize behavior across apps.
 */
export function createOSRegistry<S>() {
    return [
        {
            id: OS_COMMANDS.FOCUS,
            label: "Focus Item",
            log: true,
            run: (state: S, payload: { id: string | null }) => {
                // SIDE EFFECT: Update Focus Store
                // We do this inside 'run' so it's captured in the interaction stream.
                if (payload.id !== undefined) {
                    useFocusStore.getState().setFocus(payload.id);
                }
                return state; // Focus doesn't usually change App State
            },
        },
        {
            id: OS_COMMANDS.NAVIGATE,
            label: "Navigate",
            log: true,
            run: (state: S, payload: { direction: Direction; sourceId?: string }) => {
                const dir = payload.direction;
                const {
                    focusPath,
                    zoneRegistry,
                    focusedItemId,
                    setActiveZone,
                    setFocus,
                    stickyX,
                    stickyY,
                    setSpatialSticky
                } = useFocusStore.getState();

                // 1. Spatial Memory (Sticky Anchor Management)
                const isVertical = dir === "UP" || dir === "DOWN";
                const isHorizontal = dir === "LEFT" || dir === "RIGHT";

                let activeStickyX = stickyX;
                let activeStickyY = stickyY;

                // Axis Reset: If we move vertically, we want to anchor the X, but clear the Y.
                // If we don't have an anchor yet, we establish one from the current element.
                if (isVertical) {
                    activeStickyY = null; // Clear horizontal anchor
                    if (activeStickyX === null && focusedItemId) {
                        const el = document.getElementById(focusedItemId);
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            activeStickyX = rect.left + rect.width / 2;
                        }
                    }
                } else if (isHorizontal) {
                    activeStickyX = null; // Clear vertical anchor
                    if (activeStickyY === null && focusedItemId) {
                        const el = document.getElementById(focusedItemId);
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            activeStickyY = rect.top + rect.height / 2;
                        }
                    }
                }

                // Bubble Path: Active -> Root
                const bubblePath = focusPath.length > 0 ? [...focusPath].reverse() : (payload.sourceId ? [payload.sourceId] : []);

                for (const zoneId of bubblePath) {
                    const zoneMetadata = zoneRegistry[zoneId];
                    if (!zoneMetadata) continue;

                    const zoneItems = zoneMetadata.items || [];
                    let localPivot: string | null = null;

                    if (focusedItemId && zoneItems.includes(focusedItemId)) {
                        localPivot = focusedItemId;
                    } else if (focusedItemId) {
                        const itemEl = document.getElementById(focusedItemId);
                        const zoneEl = document.querySelector(`[data-zone-id="${zoneId}"]`);
                        if (itemEl && zoneEl) {
                            let curr: HTMLElement | null = itemEl;
                            while (curr && curr !== zoneEl) {
                                const id = curr.getAttribute("data-item-id");
                                if (id && zoneItems.includes(id)) {
                                    localPivot = id;
                                    break;
                                }
                                curr = curr.parentElement;
                            }
                        }
                    }

                    const targetId = findNextTarget(zoneMetadata.strategy || "spatial", {
                        currentId: localPivot,
                        items: zoneItems,
                        direction: dir,
                        layout: zoneMetadata.layout,
                        navMode: zoneMetadata.navMode,
                        stickyX: activeStickyX,
                        stickyY: activeStickyY
                    });

                    if (targetId) {
                        // 2. Zone Entry Logic (Deep Dive)
                        let finalTargetId = targetId;
                        const targetEl = document.getElementById(targetId);
                        const isZone = targetEl?.hasAttribute("data-zone-id");
                        const nestedZoneEl = isZone ? targetEl : targetEl?.querySelector("[data-zone-id]");
                        const targetZoneId = nestedZoneEl?.getAttribute("data-zone-id");

                        if (targetZoneId && zoneRegistry[targetZoneId]) {
                            const nestedZone = zoneRegistry[targetZoneId];
                            if (nestedZone.preset === "seamless" && nestedZone.items?.length) {
                                // Preserve Sticky Index if it was an index-based zone
                                const { stickyIndex } = useFocusStore.getState();
                                const idealIndex = stickyIndex ?? 0;
                                const clampedIndex = Math.min(idealIndex, nestedZone.items.length - 1);
                                finalTargetId = nestedZone.items[clampedIndex];
                            }
                        }

                        // 3. APPLY CHANGE
                        // We set the sticky coordinates FIRST so setFocus doesn't overwrite them
                        setSpatialSticky(activeStickyX, activeStickyY);
                        setFocus(finalTargetId);

                        const finalEl = document.getElementById(finalTargetId);
                        const finalZoneId = finalEl?.closest("[data-zone-id]")?.getAttribute("data-zone-id");
                        if (finalZoneId) setActiveZone(finalZoneId);

                        return state;
                    }

                    if (zoneMetadata.preset !== "seamless") break;
                }

                return state;
            },
        },
        {
            id: OS_COMMANDS.UNDO,
            label: "Undo",
            run: (state: S) => state, // Implementation usually in middleware (navigationMiddleware)
        },
        {
            id: OS_COMMANDS.REDO,
            label: "Redo",
            run: (state: S) => state,
        },
        {
            id: OS_COMMANDS.COPY,
            label: "Copy",
            run: (state: S) => {
                logger.debug("SYSTEM", "Global Copy Triggered");
                return state;
            },
        },
        {
            id: OS_COMMANDS.CUT,
            label: "Cut",
            run: (state: S) => {
                logger.debug("SYSTEM", "Global Cut Triggered");
                return state;
            },
        },
        {
            id: OS_COMMANDS.PASTE,
            label: "Paste",
            run: (state: S) => {
                logger.debug("SYSTEM", "Global Paste Triggered");
                return state;
            },
        },
        {
            id: OS_COMMANDS.TOGGLE_INSPECTOR,
            label: "Toggle Inspector",
            run: (state: any) => {
                if (state.ui) {
                    return {
                        ...state,
                        ui: {
                            ...state.ui,
                            isInspectorOpen: !state.ui.isInspectorOpen
                        }
                    };
                }
                return state;
            },
        },
        {
            id: OS_COMMANDS.EXIT,
            label: "Exit Zone",
            run: (state: S) => {
                const { activeZoneId, zoneRegistry, setActiveZone, setFocus } = useFocusStore.getState();
                if (!activeZoneId) return state;

                const currentZone = zoneRegistry[activeZoneId];
                if (currentZone?.parentId) {
                    // Navigate to Parent ID
                    setFocus(currentZone.parentId);
                    setActiveZone(currentZone.parentId);
                }

                return state;
            }
        }
    ];
}
