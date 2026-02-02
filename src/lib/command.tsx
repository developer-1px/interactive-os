
import { useMemo, useLayoutEffect } from 'react';
import { create } from 'zustand';

import type { KeybindingItem, KeymapConfig } from './keybinding';
import { useContextService, evalContext } from './context';
import { Trigger } from './primitives/Trigger';
import { Field } from './primitives/Field';
import { Item } from './primitives/Item';
import { Zone } from './primitives/Zone';
import type { CommandDefinition } from './definition';

import { logger } from './logger';

export interface CommandGroup<S, P = any, K extends string = string> {
    id: string;
    when?: string;
    commands: CommandDefinition<S, P, K>[];
}

/**
 * defineGroup: Factory for grouping commands under a jurisdiction
 */
export function defineGroup<S, K extends string = string>(id: string, when: string, commands: CommandDefinition<S, any, K>[]): CommandGroup<S, any, K> {
    return { id, when, commands };
}

export class CommandRegistry<S, K extends string = string> {
    private commands: Map<K, CommandDefinition<S, any, K>> = new Map();
    private keymap: KeybindingItem<any>[] | KeymapConfig<any> = [];

    register(definition: CommandDefinition<S, any, K>) {
        this.commands.set(definition.id, definition);
        logger.debug('SYSTEM', `Registered Command: [${definition.id}]`);
    }

    registerGroup(group: CommandGroup<S, any, K>) {
        group.commands.forEach(cmd => {
            const combinedWhen = group.when
                ? (cmd.when ? `(${group.when}) && (${cmd.when})` : group.when)
                : cmd.when;

            this.register({
                ...cmd,
                when: combinedWhen
            });
        });
        logger.debug('SYSTEM', `Registered Group: [${group.id}] with ${group.commands.length} commands`);
    }

    /**
     * Set external key mapping (KeybindingItem[] or KeymapConfig)
     */
    setKeymap(keymap: KeybindingItem<any>[] | KeymapConfig<any>) {
        this.keymap = keymap;
        // Count entries for logging
        const count = Array.isArray(keymap)
            ? keymap.length
            : (keymap.global?.length || 0) + Object.values(keymap.zones || {}).reduce((acc: number, arr: any) => acc + arr.length, 0);
        logger.debug('SYSTEM', `Loaded External Keymap: ${count} entries`);
    }

    get(id: K): CommandDefinition<S, any, K> | undefined {
        return this.commands.get(id);
    }

    getAll(): CommandDefinition<S, any, K>[] {
        return Array.from(this.commands.values());
    }

    getKeybindings(): KeybindingItem<any>[] {
        let rawBindings: KeybindingItem<any>[] = [];

        // Normalize Input: Flatten if it's a Config Tree
        if (Array.isArray(this.keymap)) {
            rawBindings = this.keymap;
        } else {
            // Flatten Logic
            // 1. Global
            if (this.keymap.global) {
                rawBindings.push(...this.keymap.global);
            }
            // 2. Zones (Apply Scope Logic)
            if (this.keymap.zones) {
                Object.entries(this.keymap.zones).forEach(([zoneId, bindings]) => {
                    const scopedBindings = (bindings as KeybindingItem<any>[]).map(b => {
                        // Scope Condition: activeZone == zoneId
                        const scopeStr = `activeZone == '${zoneId}'`;
                        const scopeNode = {
                            op: 'eq',
                            key: 'activeZone',
                            val: zoneId,
                            description: `activeZone == '${zoneId}'`
                        };

                        let newWhen: any;

                        if (!b.when) {
                            newWhen = scopeNode;
                        } else if (typeof b.when === 'string') {
                            newWhen = `(${b.when}) && ${scopeStr}`;
                        } else {
                            // Assume LogicNode
                            newWhen = {
                                op: 'and',
                                left: b.when,
                                right: scopeNode,
                                description: `(${b.when.description || 'Custom'} AND ${scopeNode.description})`
                            };
                        }

                        return {
                            ...b,
                            when: newWhen
                        };
                    });
                    rawBindings.push(...scopedBindings);
                });
            }
        }

        return rawBindings.map(binding => {
            const cmd = this.get(binding.command as K);
            if (!cmd) return binding;

            // Merging logic (as discussed)
            // If binding has 'when', use it (it now includes zone scope).
            // Default to command.when ONLY if binding.when is missing (e.g. global).
            return {
                ...binding,
                when: binding.when || cmd.when,
                // Removed cmd.args fallback (deprecated)
                args: binding.args,
                allowInInput: binding.allowInInput // Strict Separation: Binding owns the context!
            };
        });
    }
}

export interface CommandStoreState<S, A> {
    state: S;
    dispatch: (action: A) => void;
}

/**
 * createCommandStore:
 * Creates a global Zustand store for a given registry and initial state.
 */
export function createCommandStore<S, A extends { type: string; payload?: any }>(
    registry: CommandRegistry<S>,
    initialState: S,
    config?: {
        onStateChange?: (state: S, action: A, prevState: S) => S,
    }
) {
    return create<CommandStoreState<S, A>>((set) => ({
        state: initialState,
        dispatch: (action) => set((prev) => {
            const cmd = registry.get(action.type);
            if (!cmd) {
                logger.warn('ENGINE', `No command registered for type: ${action.type}`);
                return prev;
            }
            const nextInnerState = cmd.run(prev.state, action.payload);
            const finalState = config?.onStateChange ? config.onStateChange(nextInnerState, action, prev.state) : nextInnerState;

            if (cmd.log !== false) {
                logger.traceCommand(action.type, action.payload, prev.state, finalState);
            }

            return { state: finalState };
        })
    }));
}

/**
 * useCommandCenter:
 * Now uses the Zustand store and provides synchronized metadata and primitives.
 */
export function useCommandCenter<S, A extends { type: any; payload?: any }, K extends string = string>(
    store: ReturnType<typeof createCommandStore<S, A>>,
    registry: CommandRegistry<S, K>,
    config?: {
        mapStateToContext?: (state: S) => any
    }
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
        keybindings.forEach(kb => {
            res.set(kb.key, evalContext(kb.when, context));
        });
        return res;
    }, [keybindings, context]);

    const commandStatusList = useMemo(() => {
        return registry.getAll().map(cmd => {
            const isContextActive = evalContext(cmd.when, context);
            const isLogicEnabled = cmd.enabled ? cmd.enabled(state) : true;
            return {
                id: cmd.id,
                label: cmd.label || cmd.id,
                // kb: cmd.kb || [], // Deprecated: Command doesn't own keys anymore
                kb: [], // Set to empty, UI should use keybindings map or separate lookup
                enabled: isContextActive && isLogicEnabled
            };
        });
    }, [registry, state, context]);

    const providerValue = useMemo(() => ({
        dispatch: dispatch as any,
        currentFocusId: (state as any).ui?.focusId ?? (state as any).focusId,
        activeZone: context.activeZone as string | null,
        registry: registry,
        ctx: context,
        state: state
    }), [dispatch, (state as any).focusId, context.activeZone, registry, context, state]);

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
        registry
    };
}
