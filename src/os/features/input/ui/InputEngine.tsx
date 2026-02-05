import { useEffect, useCallback } from "react";
// Global Registry & Types
import { useFocusRegistry, FocusRegistry } from "@os/features/focus/registry/FocusRegistry";

import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { CommandTelemetryStore } from "@os/features/command/store/CommandTelemetryStore";
import { useInputTelemetry } from "@os/app/debug/LoggedKey";

// Pipeline Phases
import { interceptKeyboard } from "@os/features/command/pipeline/1-intercept";
import { resolveKeybinding, buildBubblePath, type KeybindingEntry } from "@os/features/command/pipeline/2-resolve";

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
            // Phase 1: INTERCEPT - Transform raw event to intent
            // ═══════════════════════════════════════════════════════════
            const intent = interceptKeyboard(e);
            if (!intent) return;

            // Get unified keybindings (app + OS merged)
            const allBindings = useCommandEngineStore.getState().getAllKeybindings() as unknown as KeybindingEntry[];
            if (allBindings.length === 0) return;

            // ═══════════════════════════════════════════════════════════
            // Phase 2: RESOLVE - Match intent to keybinding
            // ═══════════════════════════════════════════════════════════
            const ctx = buildContext();
            if (!ctx) return;

            const focusPath = FocusRegistry.getFocusPath();
            const bubblePath = buildBubblePath(focusPath, activeGroupId);

            const resolved = resolveKeybinding(intent, allBindings, ctx, bubblePath);
            if (!resolved) return;

            // ═══════════════════════════════════════════════════════════
            // Phase 3+: EXECUTE - Prevent default and dispatch
            // ═══════════════════════════════════════════════════════════
            e.preventDefault();
            e.stopPropagation();
            logKey(e as any, activeGroupId || "global", true);

            const { binding, resolvedArgs } = resolved;

            // Execute: Prioritize App dispatch for commands that exist in both registries
            // (e.g., OS_NAVIGATE keybinding should still dispatch to App to update state)
            const appDispatch = getActiveDispatch();
            const osReg = getOSRegistry();

            // Try app dispatch first (most commands should go here)
            if (appDispatch) {
                appDispatch({ type: binding.command, payload: resolvedArgs });
                CommandTelemetryStore.log(binding.command, resolvedArgs, 'app');
            }
            // Fallback: OS-only commands (e.g., toggle inspector)
            else if (osReg?.get(binding.command)) {
                const osCommand = osReg.get(binding.command);
                osCommand?.run({}, resolvedArgs);
                CommandTelemetryStore.log(binding.command, resolvedArgs, 'os');
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [isInitialized, activeGroupId, getActiveDispatch, getOSRegistry, logKey, buildContext]);

    return null;
}
