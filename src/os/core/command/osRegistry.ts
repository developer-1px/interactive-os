import { OS_COMMANDS } from "@os/core/command/osCommands";
import { useFocusStore } from "@os/core/focus";
import { logger } from "@os/debug/logger";
import { findNextTarget } from "@os/core/navigation";
import { createCommandFactory } from "@os/core/command/definition";

// Generic OS Command Factory
// We treat State as 'any' because OS commands act on the generic App shell
// or specific well-known keys (like 'ui') if present.
export const defineOSCommand = createCommandFactory<any>();

export const Focus = defineOSCommand({
    id: OS_COMMANDS.FOCUS,

    log: true,
    run: (state, payload: { id: string | null }) => {
        // SIDE EFFECT: Update Focus Store
        if (payload.id !== undefined) {
            useFocusStore.getState().setFocus(payload.id);
        }
        return state;
    },
});

export const Navigate = defineOSCommand({
    id: OS_COMMANDS.NAVIGATE,

    log: true,
    run: (state, payload: { direction: "UP" | "DOWN" | "LEFT" | "RIGHT"; sourceId?: string }) => {
        logger.debug("SYSTEM", `[NAVIGATE] Triggered: ${payload.direction}`, { payload });
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

        logger.debug("SYSTEM", `[NAVIGATE] Debug Context`, {
            focusPath,
            focusedItemId,
            activeZone: useFocusStore.getState().activeZoneId,
            activeZoneMetadata: zoneRegistry[useFocusStore.getState().activeZoneId || ""],
            knownZones: Object.keys(zoneRegistry)
        });

        // 1. Spatial Memory (Sticky Anchor Management)
        const isVertical = dir === "UP" || dir === "DOWN";
        const isHorizontal = dir === "LEFT" || dir === "RIGHT";

        let activeStickyX = stickyX;
        let activeStickyY = stickyY;

        // Axis Reset
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

            // 0. Direction Policy Guard
            if (zoneMetadata.allowedDirections) {
                if (!zoneMetadata.allowedDirections.includes(dir)) {
                    logger.debug("NAVIGATION", `Blocked by Zone Policy: ${zoneId} allows [${zoneMetadata.allowedDirections}] but got ${dir}. Bubbling...`);
                    continue;
                }
            }

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
                // 2. Zone Entry Logic
                let finalTargetId = targetId;
                const targetEl = document.getElementById(targetId);
                const isZone = targetEl?.hasAttribute("data-zone-id");
                const nestedZoneEl = isZone ? targetEl : targetEl?.querySelector("[data-zone-id]");
                const targetZoneId = nestedZoneEl?.getAttribute("data-zone-id");

                if (targetZoneId && zoneRegistry[targetZoneId]) {
                    const nestedZone = zoneRegistry[targetZoneId];
                    if (nestedZone.preset === "seamless" && nestedZone.items?.length) {
                        // Preserve Sticky Index
                        const { stickyIndex } = useFocusStore.getState();
                        const idealIndex = stickyIndex ?? 0;
                        const clampedIndex = Math.min(idealIndex, nestedZone.items.length - 1);
                        finalTargetId = nestedZone.items[clampedIndex];
                    }
                }

                // 3. APPLY CHANGE
                setSpatialSticky(activeStickyX, activeStickyY);
                setFocus(finalTargetId);

                const finalEl = document.getElementById(finalTargetId);
                const finalZoneId = finalEl?.closest("[data-zone-id]")?.getAttribute("data-zone-id");
                if (finalZoneId) setActiveZone(finalZoneId);

                logger.debug("SYSTEM", `[NAVIGATE] Target Found: ${finalTargetId} in Zone: ${finalZoneId}`);
                return state;
            }

            if (zoneMetadata.preset !== "seamless") break;
        }

        return state;
    },
});

export const Undo = defineOSCommand({
    id: OS_COMMANDS.UNDO,

    run: (state) => state,
});

export const Redo = defineOSCommand({
    id: OS_COMMANDS.REDO,

    run: (state) => state,
});

export const Copy = defineOSCommand({
    id: OS_COMMANDS.COPY,

    run: (state) => {
        logger.debug("SYSTEM", "Global Copy Triggered");
        return state;
    },
});

export const Cut = defineOSCommand({
    id: OS_COMMANDS.CUT,

    run: (state) => {
        logger.debug("SYSTEM", "Global Cut Triggered");
        return state;
    },
});

export const Paste = defineOSCommand({
    id: OS_COMMANDS.PASTE,

    run: (state) => {
        logger.debug("SYSTEM", "Global Paste Triggered");
        return state;
    },
});

export const ToggleInspector = defineOSCommand({
    id: OS_COMMANDS.TOGGLE_INSPECTOR,

    run: (state) => {
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
});

export const ExitZone = defineOSCommand({
    id: OS_COMMANDS.EXIT,

    run: (state) => {
        const { activeZoneId, zoneRegistry, setActiveZone, setFocus } = useFocusStore.getState();
        if (!activeZoneId) return state;

        const currentZone = zoneRegistry[activeZoneId];
        if (currentZone?.parentId) {
            setFocus(currentZone.parentId);
            setActiveZone(currentZone.parentId);
        }

        return state;
    }
});

// Aggregate Export for auto-registration
export const ALL_OS_COMMANDS = [
    Focus,
    Navigate,
    Undo,
    Redo,
    Copy,
    Cut,
    Paste,
    ToggleInspector,
    ExitZone
];
