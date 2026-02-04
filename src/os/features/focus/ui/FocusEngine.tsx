import { useCommandListener } from "@os/features/command/hooks/useCommandListener";
import { resolveBehavior } from "@os/features/focus/lib/behaviorResolver";
import { useFocusStore } from "@os/features/focus/model/focusStore";
import { executeNavigation } from "@os/features/focus/lib/focusOrchestrator";
import { executeTabNavigation, type TabNavigationContext } from "@os/features/focus/axes/handlerTab";
import { OS_COMMANDS, type OSNavigatePayload } from "@os/features/command/definitions/commandsShell";
import { useFocusBridge } from "@os/features/focus/lib/focusBridge";

/**
 * FocusEngine
 * 
 * The runtime engine that acts as the "Command Handler" for Focus and Navigation.
 * Subscribes to Command Event Bus -> Executes Focus Pipeline -> Updates Focus Store.
 */
export function FocusEngine() {
    // 1. Maintain Logic <-> DOM Bridge
    useFocusBridge();

    const setFocus = useFocusStore((s) => s.setFocus);
    const setActiveZone = useFocusStore((s) => s.setActiveZone);

    const handleNavigation = (payload: OSNavigatePayload) => {
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
            currentZoneId: activeZoneId,
            items: activeZone.items || [],
            anchor: (stickyX !== null && stickyY !== null) ? { x: stickyX, y: stickyY } : undefined
        });

        if (result) {
            if (result.targetId) {
                setFocus(result.targetId);
                // Seamlessly update active zone if crossing boundaries
                if (result.zoneId && result.zoneId !== activeZoneId) {
                    setActiveZone(result.zoneId);
                }
            }
        }
    };

    const handleTab = (isShiftTab: boolean) => {
        const { activeZoneId, focusedItemId, zoneRegistry } = useFocusStore.getState();
        if (!activeZoneId) return;

        const activeZone = zoneRegistry[activeZoneId];
        if (!activeZone) return;

        const behavior = resolveBehavior(undefined, activeZone.behavior);
        const ctx: TabNavigationContext = {
            focusedItemId: focusedItemId ?? null,
            zoneId: activeZoneId,
            isShiftTab,
            registry: zoneRegistry,
            behavior: behavior
        };

        const targetId = executeTabNavigation(ctx);

        if (targetId) {
            setFocus(targetId);
            // Note: FocusBridge will detect DOM focus change and update activeZoneId via 'focusin' event.
        }
    };

    useCommandListener([
        // --- SPATIAL NAVIGATION ---
        {
            command: OS_COMMANDS.NAVIGATE,
            handler: (payload) => handleNavigation(payload as OSNavigatePayload)
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

    return null;
}
