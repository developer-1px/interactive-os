import { useMemo } from "react";

import { evalContext } from "@os/features/logic/lib/logicEvaluator";
import { Trigger } from "@os/primitives/Trigger";
import { Field } from "@os/primitives/Field";
import { Item } from "@os/primitives/Item";
import { Zone } from "@os/primitives/Zone";
import type { CommandRegistry, createCommandStore } from "@os/features/command/model/commandStore";
import { useFocusStore } from "@os/features/focus/model/focusStore";
import type { ContextState } from "@os/features/logic/LogicNode";

/**
 * useCommandCenter:
 * Command orchestration hub for the OS.App provider.
 * Uses useFocusStore directly instead of legacy GlobalContext.
 */
export function useCommandCenter<
    S,
    A extends { type: any; payload?: any },
    K extends string = string
>(
    store: ReturnType<typeof createCommandStore<S, A>>,
    registry: CommandRegistry<S, K>,
    config?: {
        mapStateToContext?: (state: S) => ContextState;
    },
) {
    const { state, dispatch } = store();

    // 1. Focus Store (Single Source of Truth for Focus State)
    const activeZoneId = useFocusStore((s) => s.activeZoneId);
    const focusPath = useFocusStore((s) => s.focusPath);
    const focusedItemId = useFocusStore((s) => s.focusedItemId);
    const zoneRegistry = useFocusStore((s) => s.zoneRegistry);

    // 2. Build Context for Logic Evaluation
    const context: ContextState = useMemo(() => {
        const baseContext: ContextState = {
            activeZone: activeZoneId ?? undefined,
            focusPath,
            focusedItemId,
        };

        // Merge with App-specific context if provided
        if (config?.mapStateToContext) {
            return { ...baseContext, ...config.mapStateToContext(state) };
        }
        return baseContext;
    }, [activeZoneId, focusPath, focusedItemId, state, config]);

    // 3. Calculate Active Keybindings
    const keybindings = useMemo(() => registry.getKeybindings(), [registry]);

    const activeKeybindingMap = useMemo(() => {
        const res = new Map<string, boolean>();
        const activeArea = activeZoneId ? zoneRegistry[activeZoneId]?.area : undefined;

        keybindings.forEach((kb) => {
            const isLogicEnabled = evalContext(kb.when, context);

            // Scope Check: Match Zone ID in Path OR active Area
            const isScopeEnabled = !kb.zoneId ||
                focusPath.includes(kb.zoneId) ||
                (activeArea && activeArea === kb.zoneId);

            res.set(kb.key, !!(isLogicEnabled && isScopeEnabled));
        });
        return res;
    }, [keybindings, context, zoneRegistry, activeZoneId, focusPath]);

    // 4. Command Status List
    const commandStatusList = useMemo(() => {
        return registry.getAll().map((cmd) => ({
            id: cmd.id,
            label: cmd.id,
            kb: [],
            enabled: evalContext(cmd.when, context),
        }));
    }, [registry, context]);

    // 5. Legacy focusId accessor (deprecated, use focusedItemId)
    const focusId = (state as any).ui?.focusId ?? (state as any).focusId;

    // 6. Provider Value
    const providerValue = useMemo(
        () => ({
            dispatch: dispatch as any,
            currentFocusId: focusId,
            activeZone: activeZoneId,
            registry: registry,
            ctx: context,
            state: state,
            activeKeybindingMap,
        }),
        [dispatch, focusId, activeZoneId, registry, context, state, activeKeybindingMap],
    );

    return {
        state,
        dispatch,
        ctx: context,
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
