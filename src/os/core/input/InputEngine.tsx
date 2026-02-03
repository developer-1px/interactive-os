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
            // 3. Registry Resolution (Bubbling Layer)
            // We traverse from Active Zone (Leaf) -> Parents (Root)
            if (registry) {
                const canonicalKey = getCanonicalKey(e);
                const bindings = registry.getKeybindings();
                const focusStoreState = useFocusStore.getState();
                const focusPath = focusStoreState.focusPath;
                const currentActiveZoneId = focusStoreState.activeZoneId;

                // Create a bubbling path: ActiveZone -> ... -> Root
                // If focusPath is empty (metrics not ready), fallback to [activeZoneId]
                const bubblePath = focusPath.length > 0 ? [...focusPath].reverse() : (currentActiveZoneId ? [currentActiveZoneId] : []);

                // Add "global" as the final fallback
                bubblePath.push("global");

                let handled = false;

                // Optimization: Filter bindings by key first
                const keyMatches = bindings.filter(b => normalizeKeyDefinition(b.key) === canonicalKey);

                if (keyMatches.length > 0) {
                    for (const layerId of bubblePath) {
                        if (handled) break;

                        const isGlobal = layerId === "global";
                        const zoneMetadata = isGlobal ? null : zoneRegistry[layerId];
                        const zoneArea = zoneMetadata?.area;

                        // Find bindings that belong to this jurisdiction
                        const layerBindings = keyMatches.filter(b => {
                            if (isGlobal) {
                                return !b.zoneId; // Global bindings have no zoneId
                            }
                            // Match Zone specific OR Area specific bindings
                            return b.zoneId === layerId || (zoneArea && b.zoneId === zoneArea);
                        });

                        for (const binding of layerBindings) {
                            // Context for evaluation - Use REAL context, no tricking.
                            const evaluationCtx = {
                                ...ctx,
                                isInput
                            };

                            // 4. Input Safety Check
                            if (isInput && !binding.allowInInput) continue;

                            if (binding.when && !evalContext(binding.when, evaluationCtx)) continue;

                            // Success
                            e.preventDefault();
                            e.stopPropagation();
                            logKey(e as any, currentActiveZoneId || "global", true);
                            dispatch({ type: binding.command, payload: binding.args });
                            handled = true;
                            break;
                        }
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
