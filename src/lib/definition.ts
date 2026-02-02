import type { LogicNode } from './logic/builder';

export interface CommandDefinition<S, P, K extends string = string> {
    id: K;
    run: (state: S, payload: P) => S;
    label?: string;
    icon?: string;
    when?: string | LogicNode;
    kb?: string[]; // Default keybindings
    args?: P;      // Default args for keybindings
    allowInInput?: boolean;
    log?: boolean;
    enabled?: (state: S) => boolean;
}

export interface CommandFactory<S, P, K extends string = string> {
    /**
     * The Factory Call: Creates the command object.
     */
    (payload: P): { type: K; payload: P };

    /**
     * The Definition Properties: Used by the Registry/Engine.
     */
    id: K;
    run: (state: S, payload: P) => S;
    label?: string;
    icon?: string;
    when?: string | LogicNode;
    kb?: string[];
    args?: P;
    allowInInput?: boolean;
    log?: boolean;
    enabled?: (state: S) => boolean;
}

/**
 * createCommandFactory:
 * Creates a strongly typed `defineCommand` helper for a specific State type.
 */
export function createCommandFactory<S>() {
    return function defineCommand<P, K extends string = string>(def: CommandDefinition<S, P, K>): CommandFactory<S, P, K> {
        const factory = ((payload: P) => ({ type: def.id, payload })) as CommandFactory<S, P, K>;

        // Attach properties
        factory.id = def.id;
        factory.run = def.run;
        factory.label = def.label;
        factory.icon = def.icon;
        factory.when = def.when;
        factory.kb = def.kb;
        factory.args = def.args;
        factory.allowInInput = def.allowInInput;
        factory.log = def.log;
        factory.enabled = def.enabled;

        return factory;
    };
}

