import React, { useLayoutEffect, useMemo, useEffect } from "react";
import type { AppDefinition } from "@os/core/application/definition";
import { createCommandStore, CommandRegistry } from "@os/core/command/store";
import { ALL_OS_COMMANDS } from "@os/core/command/osRegistry";
import { useCommandCenter } from "@os/core/command/useCommandCenter";
import { CommandContext, setGlobalEngine } from "@os/core/command/CommandContext";
import { useContextService } from "@os/core/context";
import { useFocusStore } from "@os/core/focus";
import { InputEngine } from "@os/core/input/InputEngine";
import { Zone } from "./Zone";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

export function App<S>({
    definition,
    children
}: {
    definition: AppDefinition<S>;
    children: React.ReactNode;
}) {
    // 0. OS Persistence (Inspector)
    const [persistedInspectorOpen, setPersistedInspectorOpen] = useLocalStorage("antigravity_inspector_open", true);

    // 1. Initialize Registry & Store (Singleton per definition/instance)
    const engine = useMemo(() => {
        const registry = new CommandRegistry<S>();

        // Register App Commands
        if (definition.commands) {
            definition.commands.forEach((cmd) => registry.register(cmd));
        }

        // Register OS Standard Commands (Auto-injection)
        // Register OS Standard Commands (Auto-injection)
        ALL_OS_COMMANDS.forEach((cmd) => registry.register(cmd));

        // Set Keymap
        registry.setKeymap(definition.keymap);

        // Create Store
        const store = createCommandStore(registry, definition.model.initial, {
            persistence: definition.model.persistence,
            onStateChange: (state, action, prev) => {
                // Compose Middlewares
                let next = state;
                if (definition.middleware) {
                    for (const mw of definition.middleware) {
                        next = mw(next, action, prev);
                    }
                }
                return next;
            }
        });

        return { registry, store };
    }, [definition]);

    // 1.5 Hydrate Inspector State from OS Preference (Overrides App Persistence)
    useLayoutEffect(() => {
        const current = (engine.store.getState() as any).ui?.isInspectorOpen;
        if (current !== persistedInspectorOpen) {
            // Force update the store to match the separate OS persistence
            engine.store.setState((prev: any) => ({
                state: {
                    ...prev.state,
                    ui: {
                        ...prev.state.ui,
                        isInspectorOpen: persistedInspectorOpen
                    }
                }
            }));
        }
    }, []); // Run ONCE on mount to enforce OS preference

    // 2. Focus Subscriptions
    const activeZoneId = useFocusStore((s) => s.activeZoneId);
    const focusPath = useFocusStore((s) => s.focusPath);
    const focusedItemId = useFocusStore((s) => s.focusedItemId);

    // 3. Connect Command Center
    const config = useMemo(() => ({
        mapStateToContext: definition.contextMap
            ? (state: S) =>
                definition.contextMap!(state, {
                    activeZoneId: activeZoneId || null,
                    focusPath,
                    focusedItemId: focusedItemId || null,
                })
            : undefined,
    }), [definition, activeZoneId, focusPath, focusedItemId]);

    const center = useCommandCenter(engine.store, engine.registry, config);

    // 4. Update Context Service
    const contextService = useContextService();
    useLayoutEffect(() => {
        if (contextService) {
            contextService.updateContext({ activeZone: activeZoneId || undefined });
        }
    }, [activeZoneId, contextService]);

    // 5. Global Singleton (for non-React access like InputEngine)
    useLayoutEffect(() => {
        setGlobalEngine(() => center.providerValue);
    }, [center.providerValue]);

    // 6. OS-Level Side Effect: Persist Inspector State
    // (Hook moved to top for initialization)
    const isInspectorOpen = (center.providerValue?.state as any)?.ui?.isInspectorOpen;

    // Sync: State -> Persistence
    useEffect(() => {
        if (isInspectorOpen !== undefined && isInspectorOpen !== persistedInspectorOpen) {
            setPersistedInspectorOpen(isInspectorOpen);
        }
    }, [isInspectorOpen, persistedInspectorOpen, setPersistedInspectorOpen]);

    // Note: Initial hydration from persistence to store happens via passing modified initial state
    // but here the store is created once.
    // Ideally we'd pass `persistedInspectorOpen` to `createCommandStore` but hooks run after useMemo? No.
    // If we want to use the hook's value for initial store state, we need to move hook before useMemo.

    /* 
       Refactoring Note:
       To truly use the hook for initialization, we should look at how App is structured.
       The store is created in useMemo.
       We can pull the stored value manually distinct from the hook for initialization?
       Or Use the hook value in the useMemo deps? (Would recreate store on mount? Bad).
       
       Let's keep the sync simple:
       1. The user manually implemented localStorage.setItem.
       2. I replace it with useLocalStorage's setter.
       
       For initialization, the previous code didn't handle it (it relied on persistence adapter maybe?).
       Actually, `TodoApp` persistence might handle it.
       But user asked to fix "Persist Inspector State" previously.
       
       Let's stick to replacing the raw `localStorage` calls with the hook as requested.
    */

    return (
        <CommandContext.Provider value={center.providerValue}>
            <InputEngine />
            <Zone id={definition.id} area={definition.id} className="h-full flex flex-col">
                {children}
            </Zone>
        </CommandContext.Provider>
    );
}
