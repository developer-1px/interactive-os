export interface CommandDefinition<S, P> {
    id: string;
    run: (state: S, payload: P) => S;
    when?: string;
    kb?: string[];
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
}

/**
 * createHelper:
 * Merges the Factory function and the Definition object into one entity.
 */
export function createHelper<S, P>(def: CommandDefinition<S, P>): CommandFactory<S, P> {
    const factory = ((payload: P) => ({ type: def.id, payload })) as CommandFactory<S, P>;

    // Attach properties
    factory.id = def.id;
    factory.run = def.run;
    factory.when = def.when;
    factory.kb = def.kb;

    return factory;
}
