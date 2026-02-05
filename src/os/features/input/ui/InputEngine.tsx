import { useEffect, useCallback } from "react";
// Global Registry & Types
import { useFocusRegistry, FocusRegistry } from "@os/features/focus/registry/FocusRegistry";

import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { useInputTelemetry } from "@os/app/debug/LoggedKey";

// Pipeline Phases
import { interceptKeyboard } from "@os/features/command/pipeline/1-intercept/interceptKeyboard";
import { resolveKeybinding, buildBubblePath, type KeybindingEntry } from "@os/features/command/pipeline/2-resolve/resolveKeybinding";
import { dispatchCommand } from "@os/features/command/pipeline/3-dispatch/dispatchCommand";
import { runCommandEffects } from "@os/features/command/pipeline/4-effect/commandEffects";

/**
 * [Hardware Layer] Input Engine
 *
 * PIPELINE ARCHITECTURE:
 * 1. INTERCEPT: Transform raw event -> Intent
 * 2. RESOLVE: Match Intent -> ResolvedBinding
 * 3. DISPATCH: Execute ResolvedBinding -> ExecutionResult
 * 4. EFFECT: Handle Telemetry/Feedback
 */
export function InputEngine() {
    // --- Global Focus State (direct Zustand subscription) ---
    const activeGroupId = useFocusRegistry(s => s.activeGroupId);

    // Direct store subscription
    const isInitialized = useCommandEngineStore(s => s.isInitialized);
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
            // ═══════════════════════════════════════════════════════════
            // Phase 1: INTERCEPT
            // ═══════════════════════════════════════════════════════════
            const intent = interceptKeyboard(e);
            if (!intent) return;

            // Get unified keybindings (app + OS merged)
            const allBindings = useCommandEngineStore.getState().getAllKeybindings() as unknown as KeybindingEntry[];
            if (allBindings.length === 0) return;

            // ═══════════════════════════════════════════════════════════
            // Phase 2: RESOLVE
            // ═══════════════════════════════════════════════════════════
            const ctx = buildContext();
            if (!ctx) return;

            const focusPath = FocusRegistry.getFocusPath();
            const bubblePath = buildBubblePath(focusPath, activeGroupId);

            const resolution = resolveKeybinding(intent, allBindings, ctx, bubblePath);
            if (!resolution) return;

            // Prevent default if we have a resolution
            e.preventDefault();
            e.stopPropagation();
            logKey(e as any, activeGroupId || "global", true);

            // ═══════════════════════════════════════════════════════════
            // Phase 3: DISPATCH
            // ═══════════════════════════════════════════════════════════
            const dispatchContext = {
                appDispatch: getActiveDispatch(),
                osRegistry: getOSRegistry()
            };

            const result = dispatchCommand(resolution, dispatchContext);

            // ═══════════════════════════════════════════════════════════
            // Phase 4: EFFECT
            // ═══════════════════════════════════════════════════════════
            runCommandEffects(result, resolution);
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [isInitialized, activeGroupId, getActiveDispatch, getOSRegistry, logKey, buildContext]);

    return null;
}
