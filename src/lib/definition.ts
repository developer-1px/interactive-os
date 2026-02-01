export interface CommandDefinition<S, P> {
    id: string;
    run: (state: S, payload: P) => S;
    when?: string;
    kb?: string[];
    allowInInput?: boolean;
    log?: boolean;
}

export interface CommandFactory<S, P> {
    /**
     * The Factory Call: Creates the command object.
     */
    (payload: P): { type: string; payload: P };

    /**
     * The Definition Properties: Used by the Registry/Engine.
     */
    id: string;
    run: (state: S, payload: P) => S;
    when?: string;
    kb?: string[];
    allowInInput?: boolean;
    log?: boolean;
}

/**
 * defineCommand:
 * Merges the Factory function and the Definition object into one entity.
 */
export function defineCommand<S, P>(def: CommandDefinition<S, P>): CommandFactory<S, P> {
    const factory = ((payload: P) => ({ type: def.id, payload })) as CommandFactory<S, P>;

    // Attach properties
    factory.id = def.id;
    factory.run = def.run;
    factory.when = def.when;
    factory.kb = def.kb;
    factory.allowInInput = def.allowInInput;
    factory.log = def.log;

    return factory;
}
