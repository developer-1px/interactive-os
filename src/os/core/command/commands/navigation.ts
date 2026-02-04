import { OS_COMMANDS } from "@os/core/command/osCommands";
import { useFocusStore } from "@os/core/focus/focusStore";
import { logger } from "@os/debug/logger";
import { createCommandFactory } from "@os/core/command/definition";
import { executeNavigation } from "@os/core/focus/orchestrator";
import { executeTabNavigation } from "@os/core/focus/axes/tab/tabHandler";

export const defineOSCommand = createCommandFactory<any>();

export const Focus = defineOSCommand({
    id: OS_COMMANDS.FOCUS,

    log: true,
    run: (state, payload: { id: string | null }) => {
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
            stickyIndex,
            setSpatialSticky
        } = useFocusStore.getState();

        logger.debug("SYSTEM", `[NAVIGATE] Debug Context`, {
            focusPath,
            focusedItemId,
            activeZone: useFocusStore.getState().activeZoneId,
            activeZoneMetadata: zoneRegistry[useFocusStore.getState().activeZoneId || ""],
            knownZones: Object.keys(zoneRegistry)
        });

        const result = executeNavigation({
            direction: dir,
            focusPath,
            zoneRegistry,
            focusedItemId,
            stickyX,
            stickyY,
            stickyIndex
        });

        if (result && result.targetId) {
            setSpatialSticky(result.stickyX, result.stickyY);
            setFocus(result.targetId);

            if (result.zoneId) {
                setActiveZone(result.zoneId);
            }

            logger.debug("SYSTEM", `[NAVIGATE] Target Found: ${result.targetId} in Zone: ${result.zoneId}`);
            return state;
        }

        return state;
    },
});

/**
 * Tab Navigation Command
 * Uses recursive linear tree walking to navigate through nested zones.
 */
export const Tab = defineOSCommand({
    id: OS_COMMANDS.TAB,

    log: true,
    run: (state, payload: { reverse?: boolean }) => {
        const {
            activeZoneId,
            zoneRegistry,
            focusedItemId,
            setFocus
        } = useFocusStore.getState();

        if (!activeZoneId) return state;

        const reverse = payload?.reverse ?? false;

        const nextId = executeTabNavigation({
            focusedItemId,
            zoneId: activeZoneId,
            registry: zoneRegistry,
            isShiftTab: reverse,
            zoneItems: [], // Deprecated in favor of recursive builder
            behavior: zoneRegistry[activeZoneId]?.behavior || {
                direction: "v",
                edge: "stop",
                entry: "first",
                restore: false,
                tab: "loop",
                target: "real",
                tabSkip: "skip-disabled"
            }
        });

        if (nextId) {
            setFocus(nextId);
            // Optionally update active zone if the item belongs to a different zone
            // The cursorSlice.setFocus logic should handle this via `computePath`, 
            // but let's be safe or rely on the store's intelligence.
            // cursorSlice.ts:57 -> Updates activeZoneId if targetZoneId changes.
            // So just setFocus is enough.
        }

        return state;
    },
});

export const TabPrev = defineOSCommand({
    id: OS_COMMANDS.TAB_PREV,

    log: true,
    run: (state) => {
        return Tab.run(state, { reverse: true });
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
