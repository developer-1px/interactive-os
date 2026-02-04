import React, { useLayoutEffect, useMemo } from "react";
import type { AppDefinition } from "@os/features/application/defineApplication";
import { createCommandStore, CommandRegistry } from "@os/features/command/model/createCommandStore";
import { ALL_OS_COMMANDS } from "@os/features/command/definitions/osCommands";
import { CommandContext, setGlobalEngine } from "@os/features/command/ui/CommandContext";
import { useFocusStore } from "@os/features/focus/model/focusStore";
import { InputEngine } from "@os/features/input/ui/InputEngine";
import { FocusEngine } from "@os/features/focus/ui/FocusEngine";
import { Zone } from "@os/app/export/primitives/Zone";
import { useInspectorPersistence } from "@os/features/inspector/useInspectorPersistence";
import { evalContext } from "@os/features/logic/lib/evalContext";
import type { ContextState } from "@os/features/logic/LogicNode";

// Middleware
import { resolveFocusMiddleware } from "@os/features/focus/bridge/resolveFocusMiddleware";

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

        if (definition.commands) {
            definition.commands.forEach((cmd) => registry.register(cmd));
        }
        ALL_OS_COMMANDS.forEach((cmd) => registry.register(cmd));
        registry.setKeymap(definition.keymap);

        const store = createCommandStore(registry, definition.model.initial, {
            persistence: definition.model.persistence,
            middleware: [resolveFocusMiddleware],
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

    // 2. Inspector Persistence
    useInspectorPersistence(engine.store);

    // 3. Focus State
    const activeZoneId = useFocusStore((s) => s.activeZoneId);
    const focusPath = useFocusStore((s) => s.focusPath);
    const focusedItemId = useFocusStore((s) => s.focusedItemId);
    const zoneRegistry = useFocusStore((s) => s.zoneRegistry);

    // 4. App State
    const { state, dispatch } = engine.store();

    // 5. Build Context for Logic Evaluation
    const context: ContextState = useMemo(() => {
        const baseContext: ContextState = {
            activeZone: activeZoneId ?? undefined,
            focusPath,
            focusedItemId,
        };
        if (definition.contextMap) {
            return {
                ...baseContext,
                ...definition.contextMap(state, {
                    activeZoneId: activeZoneId || null,
                    focusPath,
                    focusedItemId: focusedItemId || null,
                })
            };
        }
        return baseContext;
    }, [activeZoneId, focusPath, focusedItemId, state, definition]);

    // 6. Active Keybinding Map
    const keybindings = useMemo(() => engine.registry.getKeybindings(), [engine.registry]);
    const activeKeybindingMap = useMemo(() => {
        const res = new Map<string, boolean>();
        const activeArea = activeZoneId ? zoneRegistry[activeZoneId]?.area : undefined;

        keybindings.forEach((kb) => {
            const isLogicEnabled = evalContext(kb.when, context);
            const isScopeEnabled = !kb.zoneId ||
                focusPath.includes(kb.zoneId) ||
                (activeArea && activeArea === kb.zoneId);
            res.set(kb.key, !!(isLogicEnabled && isScopeEnabled));
        });
        return res;
    }, [keybindings, context, zoneRegistry, activeZoneId, focusPath]);

    // 7. Provider Value
    const providerValue = useMemo(() => ({
        dispatch,
        activeZone: activeZoneId,
        registry: engine.registry,
        ctx: context,
        state,
        activeKeybindingMap,
    }), [dispatch, activeZoneId, engine.registry, context, state, activeKeybindingMap]);

    // 8. Global Singleton
    useLayoutEffect(() => {
        setGlobalEngine(() => providerValue);
    }, [providerValue]);

    return (
        <CommandContext.Provider value={providerValue}>
            <InputEngine />
            <FocusEngine />
            <Zone id={definition.id} area={definition.id} className="h-full flex flex-col">
                {children}
            </Zone>
        </CommandContext.Provider>
    );
}
