import { useMemo, useLayoutEffect, useRef } from "react";

import { useContextService, evalContext } from "@os/core/context";
import { Trigger } from "@os/ui/Trigger";
import { Field } from "@os/ui/Field";
import { Item } from "@os/ui/Item";
import { Zone } from "@os/ui/Zone";
import type { CommandRegistry, createCommandStore } from "@os/core/command/store";

import { useFocusStore } from "@os/core/focus/focusStore";

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
    // 0. Continuous Context Synchronization
    const prevContextRef = useRef<any>(null); // Use existing react import or fully qualified
    useLayoutEffect(() => {
        if (config?.mapStateToContext) {
            const nextCtx = config.mapStateToContext(state);
            // Simple deep equality check to prevent infinite loops
            if (JSON.stringify(nextCtx) !== JSON.stringify(prevContextRef.current)) {
                prevContextRef.current = nextCtx;
                updateContext(nextCtx);
            }
        }
    }, [state, config?.mapStateToContext, updateContext]);

    // 1. Auto-extract keybindings (moved to primitives FocusZone)
    const keybindings = useMemo(() => registry.getKeybindings(), [registry]);

    // 3. Auto-calculate UI metadata
    // We import useFocusStore to access Zone Registry for Area lookups
    const zoneRegistry = useFocusStore((s) => s.zoneRegistry);

    // Note: To be reactive to registry changes (dynamic zones), we might want a subscription.
    // However, zone registration is rare. Usually static layout.
    // Actually, useFocusStore() inside the hook would be better for reactivity if zones change? 
    // Yes, but focusPath is already in context?
    // Let's rely on context.focusPath for hierarchy, and zoneRegistry lookup for area.

    const activeKeybindingMap = useMemo(() => {
        const res = new Map<string, boolean>();
        const focusPath = context.focusPath || [];

        // Determine Active Area based on Active Zone (leaf of path)
        const activeZoneId = (context as any).activeZone || (focusPath.length > 0 ? focusPath[0] : null);
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
    }, [keybindings, context, zoneRegistry]);

    const commandStatusList = useMemo(() => {
        return registry.getAll().map((cmd) => {
            const isContextActive = evalContext(cmd.when, context);
            const isLogicEnabled = true;
            return {
                id: cmd.id,
                label: cmd.id,
                kb: [],
                enabled: isContextActive && isLogicEnabled,
            };
        });
    }, [registry, context]);

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
