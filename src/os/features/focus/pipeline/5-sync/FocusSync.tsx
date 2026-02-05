/**
 * FocusSync - Global Focus Side-Effect Layer
 * Pipeline Phase 5: PROJECT
 * 
 * Responsibility: Synchronize the FocusGroup state to the physical DOM (document.activeElement).
 * Listens to the active zone and its store to perform el.focus().
 */

import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { useFocusRegistry } from '../../registry/FocusRegistry';
import { DOMRegistry } from '../../registry/DOMRegistry';

// Global flag: FocusSensor should ignore focusin events when this is true
export let isProgrammaticFocus = false;

export function FocusSync() {
    // 1. Listen to which zone is active
    const activeZoneId = useFocusRegistry((s) => s.activeZoneId);
    const getFocusPath = useFocusRegistry((s) => s.getFocusPath);

    const lastPathRef = useRef<string[]>([]);

    // --- A. Focus Path Attribute Projection (aria-current) ---
    // Imperatively update the aria-current attribute on all zones in the focus path.
    // This removes the need for FocusGroup to re-render on focus changes.
    useEffect(() => {
        const nextPath = getFocusPath();
        const prevPath = lastPathRef.current;

        // 1. Clear old path
        prevPath.forEach(id => {
            if (!nextPath.includes(id)) {
                const el = DOMRegistry.getZone(id);
                if (el) el.removeAttribute('aria-current');
            }
        });

        // 2. Set new path
        nextPath.forEach(id => {
            const el = DOMRegistry.getZone(id);
            if (el) el.setAttribute('aria-current', 'true');
        });

        lastPathRef.current = nextPath;
    }, [activeZoneId, getFocusPath]);

    // --- B. Physical Focus Projection (document.activeElement) ---
    const zones = useFocusRegistry((s) => s.zones);

    // 2. Identify the active store
    const activeEntry = activeZoneId ? zones.get(activeZoneId) : null;
    const activeStore = activeEntry?.store;

    // Use a sub-component or a custom hook that subscribes to the specific store
    // so we don't re-render the whole projector on every focus change in any zone.
    if (!activeZoneId || !activeStore) return null;

    return <ActiveZoneProjector zoneId={activeZoneId} store={activeStore} />;
}

function ActiveZoneProjector({ zoneId, store }: { zoneId: string; store: any }) {
    // 3. Subscribe to the focused item ID of the ACTIVE store
    const focusedItemId = useStore(store, (s: any) => s.focusedItemId);
    const lastFocusedRef = useRef<string | null>(null);



    useEffect(() => {


        if (!focusedItemId) return;
        if (focusedItemId === lastFocusedRef.current) return;

        // 4. Physical Projection
        const targetEl = DOMRegistry.getItem(focusedItemId);
        const currentActive = document.activeElement;

        // Stale focus detection: if element doesn't exist, it was actually removed
        // In this case, do NOT call focus() - the store already has stale data
        // Recovery will be handled by the next valid user interaction
        if (!targetEl) {
            // Stale focus: element was removed, skip projection
            lastFocusedRef.current = focusedItemId;
            return;
        }



        if (targetEl && currentActive !== targetEl) {
            // Set flag to prevent FocusSensor from re-processing
            isProgrammaticFocus = true;
            targetEl.focus({ preventScroll: true });
            // Reset flag after a short delay to ensure all focusin events have fired
            setTimeout(() => {
                isProgrammaticFocus = false;
            }, 100);
        }

        lastFocusedRef.current = focusedItemId;
    }, [focusedItemId, zoneId]);

    return null;
}
