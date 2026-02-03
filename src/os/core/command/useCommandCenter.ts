import { useMemo, useLayoutEffect } from "react";

import { useContextService, evalContext } from "@os/core/context";
import { Trigger } from "@os/ui/Trigger";
import { Field } from "@os/ui/Field";
import { Item } from "@os/ui/Item";
import { Zone } from "@os/ui/Zone";
import type { CommandRegistry, createCommandStore } from "@os/core/command/store";

/**
 * useCommandCenter:
 * Now uses the Zustand store and provides synchronized metadata and primitives.
 */
export function useCommandCenter<
    S,
    A extends { type: any; payload?: any },
    K extends string = string
>(
    store: ReturnType<typeof createCommandStore<S, A>>,
    registry: CommandRegistry<S, K>,
    config?: {
        mapStateToContext?: (state: S) => any;
    },
) {
    const { state, dispatch } = store();
    const { context, updateContext } = useContextService();

    // 0. Continuous Context Synchronization
    useLayoutEffect(() => {
        if (config?.mapStateToContext) {
            updateContext(config.mapStateToContext(state));
        }
    }, [state, config?.mapStateToContext, updateContext]);

    // 1. Auto-extract keybindings (moved to primitives FocusZone)
    const keybindings = useMemo(() => registry.getKeybindings(), [registry]);

    // 3. Auto-calculate UI metadata
    const activeKeybindingMap = useMemo(() => {
        const res = new Map<string, boolean>();
        keybindings.forEach((kb) => {
            res.set(kb.key, evalContext(kb.when, context));
        });
        return res;
    }, [keybindings, context]);

    const commandStatusList = useMemo(() => {
        return registry.getAll().map((cmd) => {
            const isContextActive = evalContext(cmd.when, context);
            const isLogicEnabled = cmd.enabled ? cmd.enabled(state) : true;
            return {
                id: cmd.id,
                label: cmd.label || cmd.id,
                // kb: cmd.kb || [], // Deprecated: Command doesn't own keys anymore
                kb: [], // Set to empty, UI should use keybindings map or separate lookup
                enabled: isContextActive && isLogicEnabled,
            };
        });
    }, [registry, state, context]);

    const providerValue = useMemo(
        () => ({
            dispatch: dispatch as any,
            currentFocusId: (state as any).ui?.focusId ?? (state as any).focusId,
            activeZone: context.activeZone as string | null,
            registry: registry,
            ctx: context,
            state: state,
            activeKeybindingMap,
        }),
        [
            dispatch,
            (state as any).focusId,
            context.activeZone,
            registry,
            context,
            state,
            activeKeybindingMap,
        ],
    );

    return {
        state,
        dispatch,
        ctx: context, // Export the current evaluation context
        keybindings,
        commands: commandStatusList,
        activeKeybindingMap,
        Trigger,
        Field,
        Item,
        Zone,
        providerValue,
        registry,
    };
}
