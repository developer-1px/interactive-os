import { useMemo, useLayoutEffect } from 'react';
import { create } from 'zustand';
import { useKeybindingRegistry } from './keybinding';
import type { KeybindingItem } from './keybinding';
import { useContextService, evalContext } from './context';
import { Action, Field, Option, FocusZone, CommandContext } from './primitives';
import type { BaseCommand, ActionProps, FieldProps, OptionProps, FocusZoneProps } from './primitives';
import { logger } from './logger';

export interface CommandDefinition<S, P = any, K extends string = string> {
    id: K;
    label?: string;
    icon?: string;
    when?: string; // Context logic
    kb?: string[]; // Default keybindings
    args?: P;      // Default args for keybindings

    /**
     * Returns the next state given current state and payload.
     */
    run: (state: S, payload: P) => S;

    /**
     * Optional: Determine if command is enabled/visible beyond the 'when' clause.
     */
    enabled?: (state: S) => boolean;
}

/**
 * defineCommand: Factory for individual commands
 */
export function defineCommand<S, P = any, K extends string = string>(def: CommandDefinition<S, P, K>): CommandDefinition<S, P, K> {
    return def;
}

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

    get(id: K): CommandDefinition<S, any, K> | undefined {
        return this.commands.get(id);
    }

    getAll(): CommandDefinition<S, any, K>[] {
        return Array.from(this.commands.values());
    }

    getKeybindings(): KeybindingItem[] {
        const bindings: KeybindingItem[] = [];
        this.commands.forEach(cmd => {
            if (cmd.kb) {
                cmd.kb.forEach(key => {
                    bindings.push({
                        key,
                        command: cmd.id,
                        when: cmd.when,
                        args: cmd.args
                    });
                });
            }
        });
        return bindings;
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
        onStateChange?: (state: S, action: A) => S,
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
            const finalState = config?.onStateChange ? config.onStateChange(nextInnerState, action) : nextInnerState;

            logger.traceCommand(action.type, action.payload, prev.state, finalState);

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
                kb: cmd.kb || [],
                enabled: isContextActive && isLogicEnabled
            };
        });
    }, [registry, state, context]);

    const Provider = useMemo(() => {
        return ({ children }: { children: React.ReactNode }) => (
            <CommandContext.Provider value={{
                dispatch: dispatch as any,
                currentFocusId: (state as any).focusId,
                activeZone: context.activeZone as string | null,
                registry: registry
            }}>
                {children}
            </CommandContext.Provider>
        );
    }, [dispatch, (state as any).focusId, context.activeZone, registry]);

    return {
        state,
        dispatch,
        ctx: context, // Export the current evaluation context
        keybindings,
        commands: commandStatusList,
        activeKeybindingMap,
        Action,
        Field,
        Option,
        FocusZone,
        Provider,
        registry
    };
}
