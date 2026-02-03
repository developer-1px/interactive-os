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
                const { focusPath, zoneRegistry, focusedItemId, setActiveZone, setFocus } = useFocusStore.getState();

                // Bubble Path: Active -> Root
                const bubblePath = focusPath.length > 0 ? [...focusPath].reverse() : (payload.sourceId ? [payload.sourceId] : []);

                let targetId: string | null = null;
                let handled = false;

                for (const zoneId of bubblePath) {
                    const zoneMetadata = zoneRegistry[zoneId];
                    if (!zoneMetadata) continue;

                    // Identify the "Representative Item" in this zone's jurisdiction
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

                    targetId = findNextTarget(zoneMetadata.strategy || "spatial", {
                        currentId: localPivot,
                        items: zoneItems,
                        direction: dir,
                        layout: zoneMetadata.layout,
                        navMode: zoneMetadata.navMode
                    });

                    if (targetId) {
                        const targetEl = document.getElementById(targetId);
                        const isZone = targetEl?.hasAttribute("data-zone-id");
                        const nestedZoneEl = isZone ? targetEl : targetEl?.querySelector("[data-zone-id]");
                        const targetZoneId = nestedZoneEl?.getAttribute("data-zone-id");

                        if (targetZoneId && zoneRegistry[targetZoneId]) {
                            const nestedZone = zoneRegistry[targetZoneId];
                            if (nestedZone.preset === "seamless" && nestedZone.items?.length) {
                                targetId = nestedZone.lastFocusedId || nestedZone.items[0];
                            }
                        }

                        // Execute Focus Change
                        setFocus(targetId);

                        // Update Active Zone
                        const finalEl = document.getElementById(targetId);
                        const finalZoneId = finalEl?.closest("[data-zone-id]")?.getAttribute("data-zone-id");
                        if (finalZoneId) {
                            setActiveZone(finalZoneId);
                        }

                        handled = true;
                        break;
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
        }
    ];
}
