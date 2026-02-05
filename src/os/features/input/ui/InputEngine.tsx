import { useEffect, useCallback } from "react";
// Global Registry & Types
import { useFocusRegistry, FocusRegistry } from "@os/features/focus/registry/FocusRegistry";

import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { getCanonicalKey, normalizeKeyDefinition } from "@os/features/input/lib/getCanonicalKey";
import { evalContext } from "@os/features/AntigravityOS";
import { useInputTelemetry } from "@os/app/debug/LoggedKey";

/**
 * [Hardware Layer] Input Engine
 *
 * Lookup-based keybinding resolution:
 * 1. First check active app registry
 * 2. Fall back to OS registry
 */
export function InputEngine() {
    // --- Global Focus State (direct Zustand subscription) ---
    const activeGroupId = useFocusRegistry(s => s.activeGroupId);

    // Direct store subscription
    const isInitialized = useCommandEngineStore(s => s.isInitialized);
    const getActiveRegistry = useCommandEngineStore(s => s.getActiveRegistry);
    const getOSRegistry = useCommandEngineStore(s => s.getOSRegistry);
    const getActiveDispatch = useCommandEngineStore(s => s.getActiveDispatch);
    const getActiveState = useCommandEngineStore(s => s.getActiveState);
    const getActiveContextMap = useCommandEngineStore(s => s.getActiveContextMap);

    const logKey = useInputTelemetry((state) => state.logKey);

    // Build context on-demand
    const buildContext = useCallback(() => {
        if (!isInitialized) return null;

        const focusPath = FocusRegistry.getFocusPath();
        const groups = FocusRegistry.get().groups;
        const currentActiveGroupId = FocusRegistry.get().activeGroupId;
        const activeGroupStore = currentActiveGroupId ? groups.get(currentActiveGroupId)?.store : null;
        const focusedItemId = activeGroupStore?.getState().focusedItemId ?? null;

        const baseContext = {
            activeGroup: currentActiveGroupId ?? undefined,
            focusPath,
            focusedItemId,
        };

        const contextMap = getActiveContextMap();
        const state = getActiveState();
        if (contextMap && state !== undefined) {
            return {
                ...baseContext,
                ...contextMap(state, {
                    activeGroupId: currentActiveGroupId || null,
                    focusPath,
                    focusedItemId: focusedItemId || null,
                })
            };
        }
        return baseContext;
    }, [isInitialized, getActiveState, getActiveContextMap]);

    // --- Keyboard Sink ---
    useEffect(() => {
        if (!isInitialized) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.defaultPrevented) return;
            if (e.isComposing) return;

            // Input field detection
            const target = e.target as HTMLElement;
            const isInput = (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target.isContentEditable
            );

            // Get registries at dispatch time
            const appRegistry = getActiveRegistry();
            const osRegistry = getOSRegistry();

            // Collect all keybindings with source info: app first, then OS fallback
            const allBindings = [
                ...(appRegistry?.getKeybindings() || []).map((b: any) => ({ ...b, _source: 'app' })),
                ...(osRegistry?.getKeybindings() || []).map((b: any) => ({ ...b, _source: 'os' })),
            ];

            if (allBindings.length === 0) return;

            const canonicalKey = getCanonicalKey(e);
            const focusPath = FocusRegistry.getFocusPath();
            const bubblePath = focusPath.length > 0 ? [...focusPath].reverse() : (activeGroupId ? [activeGroupId] : []);
            bubblePath.push("global");

            let handled = false;
            const keyMatches = allBindings.filter((b: any) => normalizeKeyDefinition(b.key) === canonicalKey);

            if (keyMatches.length > 0) {
                const ctx = buildContext();

                for (const layerId of bubblePath) {
                    if (handled) break;

                    const isGlobal = layerId === "global";
                    const layerBindings = keyMatches.filter((b: any) => {
                        if (isGlobal) return !b.groupId;
                        return b.groupId === layerId;
                    });

                    for (const binding of layerBindings) {
                        const evaluationCtx = { ...ctx, isInput };

                        if (isInput && !binding.allowInInput) continue;
                        if (binding.when && !evalContext(binding.when, evaluationCtx)) continue;

                        e.preventDefault();
                        e.stopPropagation();
                        logKey(e as any, activeGroupId || "global", true);

                        // Dispatch Logic: Prioritize App Context
                        const appDispatch = getActiveDispatch();
                        const appReg = getActiveRegistry();
                        const osReg = getOSRegistry();

                        // Even if keybinding came from OS layer (e.g. Arrow keys),
                        // if the active App handles this command, we should dispatch to the App.
                        const existsInApp = appReg?.get(binding.command);

                        if (existsInApp) {
                            appDispatch?.({ type: binding.command, payload: binding.args });
                        }
                        // If not in App, try OS execution (e.g. global inspector toggle)
                        else if (osReg?.get(binding.command)) {
                            const osCommand = osReg.get(binding.command);
                            // Note: OS commands run with empty state unless they access external stores (like InspectorStore)
                            osCommand?.run({}, binding.args);
                        }

                        handled = true;
                        break;
                    }
                }
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [isInitialized, activeGroupId, getActiveRegistry, getOSRegistry, getActiveDispatch, logKey, buildContext]);

    return null;
}
