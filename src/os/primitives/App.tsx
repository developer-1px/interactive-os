import React, { useLayoutEffect, useMemo } from "react";
import type { AppDefinition } from "@os/features/application/definition";
import { createCommandStore, CommandRegistry } from "@os/features/command/model/commandStore";
import { ALL_OS_COMMANDS } from "@os/features/command/definitions/osCommands";
import { useCommandCenter } from "@os/shared/hooks/useCommandCenter";
import { CommandContext, setGlobalEngine } from "@os/features/command/ui/CommandContext";
import { useFocusStore } from "@os/features/focus/model/focusStore";
import { InputEngine } from "@os/features/input/ui/InputEngine";
import { FocusEngine } from "@os/features/focus/ui/FocusEngine";
import { Zone } from "@os/primitives/Zone";
import { useInspectorPersistence } from "@os/features/inspector/useInspectorPersistence";

export function App<S>({
    definition,
    children
}: {
    definition: AppDefinition<S>;
    children: React.ReactNode;
}) {
    // 1. Initialize Registry & Store
    const engine = useMemo(() => {
        const registry = new CommandRegistry<S>();

        // Register App Commands
        if (definition.commands) {
            definition.commands.forEach((cmd) => registry.register(cmd));
        }

        // Register OS Standard Commands
        ALL_OS_COMMANDS.forEach((cmd) => registry.register(cmd));

        // Set Keymap
        registry.setKeymap(definition.keymap);

        // Create Store
        const store = createCommandStore(registry, definition.model.initial, {
            persistence: definition.model.persistence,
            onStateChange: (state: S, action: any, prev: S) => {
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

    // 2. OS-Level Inspector Persistence (Separate Concern)
    useInspectorPersistence(engine.store);

    // 3. Focus Subscriptions
    const activeZoneId = useFocusStore((s) => s.activeZoneId);
    const focusPath = useFocusStore((s) => s.focusPath);
    const focusedItemId = useFocusStore((s) => s.focusedItemId);

    // 4. Connect Command Center
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

    // 5. Global Singleton (for non-React access)
    useLayoutEffect(() => {
        setGlobalEngine(() => center.providerValue);
    }, [center.providerValue]);

    return (
        <CommandContext.Provider value={center.providerValue}>
            <InputEngine />
            <FocusEngine />
            <Zone id={definition.id} area={definition.id} className="h-full flex flex-col">
                {children}
            </Zone>
        </CommandContext.Provider>
    );
}
