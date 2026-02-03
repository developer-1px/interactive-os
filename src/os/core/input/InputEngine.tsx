import { useEffect } from "react";
import { useFocusStore } from "@os/core/focus";
import { useCommandEngine } from "@os/core/command/CommandContext";
import { getCanonicalKey, normalizeKeyDefinition } from "@os/core/input/keybinding";
import { evalContext } from "@os/core/context";
import { useInputTelemetry } from "@os/debug/inputTelemetry";
import { OS_COMMANDS } from "@os/core/command/osCommands";

/**
 * [Hardware Layer] Input Engine
 *
 * The Single Source of Truth for all physical inputs (Keyboard & Mouse).
 * replacing distributed 'onKeyDown' handlers in Zones.
 */
export function InputEngine() {
    const {
        activeZoneId,
        focusedItemId,
        zoneRegistry,
        setFocus,
        setActiveZone
    } = useFocusStore();

    const { dispatch, registry, ctx } = useCommandEngine();
    const logKey = useInputTelemetry((state) => state.logKey);

    // --- Keyboard Sink ---
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.defaultPrevented) return;

            // 1. IME Composition Safety (Critical for CJK)
            if (e.isComposing) {
                return;
            }

            // 2. Extrinsic State Check (Input Guard)
            const activeEl = document.activeElement as HTMLElement;
            const isInput =
                activeEl &&
                (activeEl.tagName === "INPUT" ||
                    activeEl.tagName === "TEXTAREA" ||
                    activeEl.isContentEditable);




            // 3. Registry Resolution (Bubbling Layer)
            // We traverse from Active Zone (Leaf) -> Parents (Root)
            if (registry) {
                const canonicalKey = getCanonicalKey(e);
                const bindings = registry.getKeybindings();
                const focusPath = useFocusStore.getState().focusPath;

                // Create a bubbling path: ActiveZone -> ... -> Root
                // If focusPath is empty (metrics not ready), fallback to [activeZoneId]
                const bubblePath = focusPath.length > 0 ? [...focusPath].reverse() : (activeZoneId ? [activeZoneId] : []);

                // Add "global" as the final fallback
                bubblePath.push("global");

                let handled = false;

                for (const zoneId of bubblePath) {
                    if (handled) break;

                    const isGlobal = zoneId === "global";
                    const zoneMetadata = isGlobal ? null : zoneRegistry[zoneId];
                    const zoneArea = zoneMetadata?.area;

                    // Context for this specific layer
                    const layerCtx = {
                        ...ctx,
                        isInput,
                        activeZone: isGlobal ? undefined : zoneId, // Logic: "Am I the active zone?"
                        area: zoneArea
                    };

                    const match = bindings.find(b => {
                        const normalizedBinding = normalizeKeyDefinition(b.key);
                        if (normalizedBinding !== canonicalKey) return false;
                        if (isInput && !b.allowInInput) return false;

                        // SCOPE CHECK:
                        // 1. If Global, only allow global bindings (no 'when' usually, or explicit global flag)
                        //    Actually, our store.tsx flattened bindings already include scope logic in 'when'.
                        //    BUT: That scope logic is `activeZone == id`.
                        //    We need to relax that. We want "If I am in the bubble path, I am valid".
                        //    
                        //    Correction: The store.tsx `getKeybindings()` injects `activeZone == zoneId`.
                        //    This is too strict for bubbling. It prevents a parent from handling a child's event.
                        //    
                        //    FIX: We should IGNORE the store's baked-in scope check if we are doing custom bubbling here.
                        //    OR: We rely on `evalContext` with a tricked `activeZone`.
                        //    
                        //    Let's try tricking `activeZone` in `layerCtx`.
                        //    If we set `activeZone: zoneId`, then the baked-in `activeZone == zoneId` check passes!

                        if (b.when && !evalContext(b.when, layerCtx)) return false;

                        // If the binding was scoped to a specific zone (via keymap.zones), 
                        // we must ensure we are currently checking THAT zone.
                        // (The 'when' clause injection in store.tsx handles this)
                        return true;
                    });

                    if (match) {
                        e.preventDefault();
                        e.stopPropagation();
                        logKey(e as any, activeZoneId || "global", true);
                        dispatch({ type: match.command, payload: match.args });
                        handled = true;
                        return;
                    }
                }
            }

            // Log Unhandled
            logKey(e as any, activeZoneId || "global", false);
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [activeZoneId, focusedItemId, zoneRegistry, ctx, registry, dispatch, logKey]);

    // --- Mouse Sink (Global Interaction) ---
    useEffect(() => {
        const handleGlobalMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // 1. Item Selection (Click-to-Focus)
            const itemEl = target.closest('[data-item-id]');
            if (itemEl) {
                const itemId = itemEl.getAttribute('data-item-id');
                // Prevent browser focus drift (Keep it on Body or Zone)
                e.preventDefault();
                if (itemId) {
                    dispatch({
                        type: OS_COMMANDS.FOCUS,
                        payload: { id: itemId, sourceId: activeZoneId }
                    });
                }
            }

            // 2. Zone Activation (Click-to-Activate)
            const zoneEl = target.closest('[data-zone-id]');
            if (zoneEl) {
                const zoneId = zoneEl.getAttribute('data-zone-id');
                if (zoneId && zoneId !== activeZoneId) {
                    setActiveZone(zoneId);
                }
            }
        };

        // Capture phase to intercept before React Synthetic Events
        window.addEventListener("mousedown", handleGlobalMouseDown, { capture: true });
        return () => window.removeEventListener("mousedown", handleGlobalMouseDown, { capture: true });
    }, [activeZoneId, setFocus, setActiveZone]);

    return null;
}
