import { useEffect } from "react";
import { useFocusStore } from "@os/features/focus/model/focusStore";
import { handlerTarget } from "@os/features/focus/axes/handlerTarget";

/**
 * useFocusBridge
 * 
 * Bidirectional synchronization between browser focus and virtual focus store.
 * 
 * Browser Focus → Virtual Focus:
 *   - Listens to global 'focusin' events
 *   - Updates focusedItemId when browser focus changes to an Item
 * 
 * Virtual Focus → Browser Focus:
 *   - useEffect watches focusedItemId and calls handlerTarget (via Target Axis Handler)
 * 
 * Usage: Call once at the root of your app (e.g., App.tsx or CommandProvider)
 */
export function useFocusBridge() {
    const setFocus = useFocusStore((s) => s.setFocus);
    const setActiveZone = useFocusStore((s) => s.setActiveZone);
    const focusedItemId = useFocusStore((s) => s.focusedItemId);

    // Browser Focus → Virtual Focus
    useEffect(() => {
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;

            // Case 1: Focus on Item directly
            const itemEl = target.closest('[data-item-id]');
            if (itemEl) {
                const itemId = itemEl.getAttribute('data-item-id');
                if (!itemId) return;

                // Check if already focused (avoid infinite loop)
                const currentFocusId = useFocusStore.getState().focusedItemId;
                if (itemId === currentFocusId) return;

                // Sync to virtual focus store
                setFocus(itemId);
                return;
            }

            // Case 2: Focus on Zone (Tab navigation between Zones)
            const zoneEl = target.closest('[data-zone-id]');
            if (zoneEl && zoneEl === target) {
                const zoneId = zoneEl.getAttribute('data-zone-id');
                if (!zoneId) return;

                // Sync Zone active state
                setActiveZone(zoneId);

                // Get Zone's items and focus the first one
                const zoneRegistry = useFocusStore.getState().zoneRegistry;
                const zone = zoneRegistry[zoneId];
                if (zone?.items?.length) {
                    const firstItemId = zone.items[0];
                    setFocus(firstItemId);
                }
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        return () => document.removeEventListener('focusin', handleFocusIn);
    }, [setFocus]);

    // Virtual Focus → Browser Focus (using Target Axis Handler)
    useEffect(() => {
        if (!focusedItemId) return;

        // Get behavior to determine target mode (real vs virtual)
        const zoneRegistry = useFocusStore.getState().zoneRegistry;
        const focusPath = useFocusStore.getState().focusPath;
        const activeZoneId = focusPath[focusPath.length - 1];
        const activeZone = activeZoneId ? zoneRegistry[activeZoneId] : null;
        const targetMode = activeZone?.behavior?.target ?? "real";

        const el = document.getElementById(focusedItemId);
        if (!el) return;

        // Apply focus if not already focused
        if (document.activeElement !== el) {
            handlerTarget(focusedItemId, targetMode, { preventScroll: true });
        }

        // Scroll into view if needed (only when out of viewport)
        el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }, [focusedItemId]);
}

