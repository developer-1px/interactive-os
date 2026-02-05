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

        if (targetEl && currentActive !== targetEl) {
            // console.log(`[Projector] Physically focusing ${focusedItemId} in zone ${zoneId}`);
            targetEl.focus({ preventScroll: true });
        }

        lastFocusedRef.current = focusedItemId;
    }, [focusedItemId, zoneId]);

    return null;
}
