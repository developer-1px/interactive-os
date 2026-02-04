import { useCommandListener } from "@os/shared/hooks/useCommandListener";
import { resolveBehavior } from "@os/features/focus/lib/behaviorResolver";
import { useFocusStore } from "@os/features/focus/model/focusStore";
import { executeNavigation } from "@os/features/focus/lib/focusOrchestrator";
import { executeTabNavigation, type TabNavigationContext } from "@os/features/focus/axes/handlerTab";
import { OS_COMMANDS, type OSNavigatePayload } from "@os/features/command/definitions/commandsShell";
import { useFocusBridge } from "@os/features/focus/lib/focusBridge";
import { logger } from "@os/debug/logger";

/**
 * FocusEngine
 * 
 * The runtime engine that acts as the "Command Handler" for
 * Focus and Navigation commands. It subscribes to the Command Event Bus
 * and executes the Focus Logic (Orchestrator/Pipeline), then updates
 * the Focus Store.
 * 
 * This enables "Concept-Driven" navigation (Commands) rather than
 * direct "Event-Driven" navigation (KeyHandlers).
 */
export function FocusEngine() {
    // 1. Maintain Logic <-> DOM Bridge
    useFocusBridge();

    const setFocus = useFocusStore((s) => s.setFocus);
    const setActiveZone = useFocusStore((s) => s.setActiveZone);

    useCommandListener([
        // --- SPATIAL NAVIGATION (Arrows) ---
        {
            command: OS_COMMANDS.NAVIGATE,
            handler: (payload: OSNavigatePayload) => {
                const { activeZoneId, focusedItemId, focusPath, zoneRegistry, stickyX, stickyY, stickyIndex } = useFocusStore.getState();

                if (!activeZoneId) return;

                const activeZone = zoneRegistry[activeZoneId];
                if (!activeZone) return;

                const result = executeNavigation({
                    direction: payload.direction,
                    focusPath,
                    zoneRegistry,
                    focusedItemId,
                    stickyX,
                    stickyY,
                    stickyIndex,

                    // Pipeline State
                    currentZoneId: activeZoneId,
                    items: activeZone.items || [],
                    anchor: (stickyX !== null && stickyY !== null) ? { x: stickyX, y: stickyY } : undefined
                });

                if (result) {
                    if (result.targetId) {
                        setFocus(result.targetId);
                        // Also update active zone if it changed (Seamless)
                        if (result.zoneId && result.zoneId !== activeZoneId) {
                            setActiveZone(result.zoneId);
                        }
                    } else if (result.shouldTrap) {
                        logger.debug("SYSTEM", "Navigation Trapped (Boundary reached)");
                    }
                }
            }
        },

        // --- TAB NAVIGATION ---
        {
            command: OS_COMMANDS.TAB,
            handler: () => handleTab(false)
        },
        {
            command: OS_COMMANDS.TAB_PREV,
            handler: () => handleTab(true)
        }
    ]);

    const handleTab = (isShiftTab: boolean) => {
        const { activeZoneId, focusedItemId, zoneRegistry } = useFocusStore.getState();
        if (!activeZoneId) return;

        const activeZone = zoneRegistry[activeZoneId];
        if (!activeZone) return;

        // Resolve Behavior (merge defaults if needed)
        const behavior = resolveBehavior(undefined, activeZone.behavior);

        const ctx: TabNavigationContext = {
            focusedItemId: focusedItemId ?? null, // Coerce undefined to null if needed, or pass as is
            zoneId: activeZoneId,
            isShiftTab,
            registry: zoneRegistry,
            behavior: behavior
        };

        const targetId = executeTabNavigation(ctx);

        if (targetId) {
            setFocus(targetId);
            // Tab usually implies moving to a new Zone, so we should check 
            // the zone of the target item and update activeZoneId
            // But `setFocus` might handle it? 
            // `FocusBridge` listens to `focusin` and updates ActiveZone.
            // But if we `setFocus` virtually, we need to enforce DOM focus.
            // `FocusBridge` does that (Virtual -> Browser).
            // Then Browser -> `focusin` -> `setActiveZone`.
            // So we just set focus and wait for the cycle.
        }
    };

    return null;
}
