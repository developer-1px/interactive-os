import { useEffect } from "react";
// [NEW] Global Registry & Types
import { useFocusRegistry, FocusRegistry } from "@os/features/focus/registry/FocusRegistry";
// import { useFocusGroupStore } from "@os/features/focusGroup/primitives/FocusGroup"; // Not used here? 

import { useCommandEngine } from "@os/features/command/ui/CommandContext";
import { getCanonicalKey, normalizeKeyDefinition } from "@os/features/input/lib/getCanonicalKey";
import { evalContext } from "@os/features/AntigravityOS";
import { useInputTelemetry } from "@os/app/debug/LoggedKey";

/**
 * [Hardware Layer] Input Engine
 *
 * The Single Source of Truth for all physical inputs (Keyboard & Mouse).
 * replacing distributed 'onKeyDown' handlers in Zones.
 */
export function InputEngine() {
    // --- Global Focus State ---
    const activeZoneId = useFocusRegistry(s => s.activeZoneId);

    // NOTE: Do NOT call getFocusPath() inside selector! It returns new array each time.
    // Instead, call it inside event handler using static accessor.

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
                // Get fresh path via static method (avoids selector infinite loop)
                const focusPath = FocusRegistry.getFocusPath();

                // Create a bubbling path: ActiveZone -> ... -> Root
                // If focusPath is empty (metrics not ready), fallback to [activeZoneId]
                const bubblePath = focusPath.length > 0 ? [...focusPath].reverse() : (activeZoneId ? [activeZoneId] : []);

                // Add "global" as the final fallback
                bubblePath.push("global");

                let handled = false;

                // Optimization: Filter bindings by key first
                const keyMatches = bindings.filter(b => normalizeKeyDefinition(b.key) === canonicalKey);

                if (keyMatches.length > 0) {
                    for (const layerId of bubblePath) {
                        if (handled) break;

                        const isGlobal = layerId === "global";

                        // Zone Metadata Access? 
                        // The registry now has 'config' in the store?
                        // We might need to access the store of the zone to check 'area' or other metadata.
                        // const zoneStore = FocusRegistry.getZone(layerId);
                        // const zoneConfig = zoneStore?.getState().config;
                        // const zoneArea = zoneConfig?.area; (Config doesn't usually have area? ZoneProps does)
                        // Wait, 'area' was on ZoneProps. Where is it now?
                        // Ideally, FocusGroup config should include metadata.
                        // Assume zoneId is the primary identifier for now.

                        const zoneArea = undefined; // 'area' lookup needs restoration if critical.

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

                            // Success - OS handles all commands including Tab (DFS-based navigation)
                            e.preventDefault();
                            e.stopPropagation();
                            logKey(e as any, activeZoneId || "global", true);
                            dispatch({ type: binding.command, payload: binding.args });
                            handled = true;
                            break;
                        }
                    }
                }
            }

            // Log Unhandled
            // logKey(e as any, activeZoneId || "global", false);
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [activeZoneId, ctx, registry, dispatch, logKey]);

    return null;
}
