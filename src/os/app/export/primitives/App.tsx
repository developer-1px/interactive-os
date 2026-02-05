import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { AppDefinition } from "@os/features/application/defineApplication";
import { createCommandStore, CommandRegistry } from "@os/features/command/model/createCommandStore";
import { ALL_OS_COMMANDS } from "@os/features/command/definitions/osCommands";
import { CommandContext, setGlobalEngine } from "@os/features/command/ui/CommandContext";
import { InputEngine } from "@os/features/input/ui/InputEngine";
import { FocusCommandHandler } from "@os/features/focusZone/pipeline/2-parse/FocusCommandHandler";
import { GlobalFocusSensor } from "@os/features/focusZone/pipeline/1-intercept/GlobalFocusSensor";
import { GlobalFocusProjector } from "@os/features/focusZone/pipeline/5-project/GlobalFocusProjector";
import { useGlobalZoneRegistry } from "@os/features/focusZone/registry/GlobalZoneRegistry";
import { Zone } from "@os/app/export/primitives/Zone";
import { useInspectorPersistence } from "@os/features/inspector/useInspectorPersistence";
import { evalContext } from "@os/features/logic/lib/evalContext";
import type { ContextState } from "@os/features/logic/LogicNode";

// ═══════════════════════════════════════════════════════════════════
// App Config Context
// ═══════════════════════════════════════════════════════════════════

export interface AppConfig {
    isAppShell: boolean;
}

export const AppContext = createContext<AppConfig>({ isAppShell: true });
export const useAppConfig = () => useContext(AppContext);

// ═══════════════════════════════════════════════════════════════════
// App Component
// ═══════════════════════════════════════════════════════════════════

export function App<S>({
    definition,
    children,
    isAppShell = false
}: {
    definition: AppDefinition<S>;
    children: React.ReactNode;
    isAppShell?: boolean;
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

    // 3. Focus State (Global Registry)
    const activeZoneId = useGlobalZoneRegistry((s) => s.activeZoneId);
    const zones = useGlobalZoneRegistry((s) => s.zones);

    const focusPath = useGlobalZoneRegistry(
        useShallow((s) => {
            if (!s.activeZoneId) return [];
            const path: string[] = [];
            let currentId: string | null = s.activeZoneId;
            while (currentId) {
                path.unshift(currentId);
                const entry = s.zones.get(currentId);
                currentId = entry?.parentId || null;
                if (path.length > 100) break;
            }
            return path;
        })
    );

    // FocusedItemId: derive from active zone store
    const activeZoneStore = activeZoneId ? zones.get(activeZoneId)?.store : null;
    const focusedItemId = activeZoneStore?.getState().focusedItemId ?? null;

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
        keybindings.forEach((kb) => {
            const isLogicEnabled = evalContext(kb.when, context);
            const isScopeEnabled = !kb.zoneId || focusPath.includes(kb.zoneId);
            res.set(kb.key, !!(isLogicEnabled && isScopeEnabled));
        });
        return res;
    }, [keybindings, context, focusPath]);

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

    // 9. Body class for AppShell mode
    useEffect(() => {
        if (isAppShell) {
            document.body.classList.add('app-shell');
        } else {
            document.body.classList.remove('app-shell');
        }
        return () => document.body.classList.remove('app-shell');
    }, [isAppShell]);

    const zoneClassName = isAppShell
        ? "h-full flex flex-col overflow-hidden"
        : "min-h-full flex flex-col";

    return (
        <AppContext.Provider value={{ isAppShell }}>
            <CommandContext.Provider value={providerValue}>
                <InputEngine />
                <FocusCommandHandler />
                <GlobalFocusSensor />
                <GlobalFocusProjector />
                <Zone id={definition.id} area={definition.id} className={zoneClassName}>
                    {children}
                </Zone>
            </CommandContext.Provider>
        </AppContext.Provider>
    );
}
