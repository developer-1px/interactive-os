/**
 * defineApp v4 — PoC for 4-tier API
 *
 * Goal: Verify TypeScript type inference for the new API shape.
 *
 * 4 Tiers:
 *   1. defineApp(appId, initialState) → App
 *   2. App.createZone(name) → Zone
 *   3. Zone.command(type, handler) → CommandFactory  (individually typed)
 *   4. Zone.bind({ role, onCheck, ... }) → { Zone, Item, Field }
 *
 * Key questions to verify:
 *   Q1. Does `ctx` type infer from Zone<S>'s generic parameter?
 *   Q2. Does each command get individually typed without `commands: {}` return?
 *   Q3. Does `bind()` return typed React components?
 *   Q4. Does `app.create()` test instance work with dispatch(command(payload))?
 */

// ═══════════════════════════════════════════════════════════════════
// Minimal kernel stubs (for type checking only)
// ═══════════════════════════════════════════════════════════════════

/** Branded command object */
type Command<Type extends string = string, Payload = void> = {
    readonly type: Type;
    readonly payload: Payload;
    readonly __brand: "command";
};

/** Factory that creates typed commands */
type CommandFactory<Type extends string = string, Payload = void> = {
    (
        ...args: [Payload] extends [undefined]
            ? []
            : undefined extends Payload
            ? [payload?: Payload]
            : [payload: Payload]
    ): Command<Type, Payload>;
    readonly commandType: Type;
};

// ═══════════════════════════════════════════════════════════════════
// Handler types — This is where boilerplate reduction happens
// ═══════════════════════════════════════════════════════════════════

/** Command context — S is inferred from Zone<S> */
type CommandContext<S> = {
    readonly state: S;
};

/** Return type from handlers */
type HandlerResult<S> = {
    state: S;
    dispatch?: Command;
} | void;

/**
 * Command handler signature.
 *
 * Current (v3): (ctx: { state: S }) => (payload: P) => ({ state: S })
 * New (v4):     (ctx, payload) => ({ state }) — ctx inferred, flat
 *
 * We keep the curried form internally for kernel compatibility,
 * but the user-facing API is flat.
 */
type FlatHandler<S, P> = (ctx: CommandContext<S>, payload: P) => HandlerResult<S>;

// ═══════════════════════════════════════════════════════════════════
// Zone declaration types
// ═══════════════════════════════════════════════════════════════════

interface ZoneBindings {
    role: string;
    onCheck?: CommandFactory<any, any>;
    onAction?: CommandFactory<any, any>;
    onDelete?: CommandFactory<any, any>;
    onCopy?: CommandFactory<any, any>;
    onCut?: CommandFactory<any, any>;
    onPaste?: CommandFactory<any, any>;
    onMoveUp?: CommandFactory<any, any>;
    onMoveDown?: CommandFactory<any, any>;
    onUndo?: CommandFactory<any, any>;
    onRedo?: CommandFactory<any, any>;
}

interface FieldBindings {
    onChange?: CommandFactory<any, any>;
    onSubmit?: CommandFactory<any, any>;
    onCancel?: CommandFactory<any, any>;
}

// ═══════════════════════════════════════════════════════════════════
// React component stubs
// ═══════════════════════════════════════════════════════════════════

type FC<P = object> = (props: P) => any;

interface BoundComponents {
    Zone: FC<{ id?: string; className?: string; children?: any }>;
    Item: FC<{ id: string; className?: string; children?: any }>;
    Field: FC<{ name: string; value?: string; className?: string }>;
}

// ═══════════════════════════════════════════════════════════════════
// Tier 2: ZoneHandle — returned by createZone
// ═══════════════════════════════════════════════════════════════════

interface ZoneHandle<S> {
    /**
     * Tier 3: Define a command.
     *
     * Type parameters:
     *   T — command type string (inferred from 1st arg)
     *   P — payload type (inferred from handler's 2nd param)
     *
     * ctx: CommandContext<S> is inferred from Zone<S>. No manual annotation!
     */
    command<T extends string, P = void>(
        type: T,
        handler: FlatHandler<S, P>,
    ): CommandFactory<T, P>;

    /**
     * Tier 4: Bind commands to zone events → returns React components.
     */
    bind(config: ZoneBindings & { field?: FieldBindings }): BoundComponents;
}

// ═══════════════════════════════════════════════════════════════════
// Tier 1: AppHandle — returned by defineApp
// ═══════════════════════════════════════════════════════════════════

type SelectorMap<S> = Record<string, (state: S, ...args: any[]) => any>;

interface TestInstance<S> {
    readonly state: S;
    dispatch<T extends string, P>(command: Command<T, P>): void;
    reset(): void;
}

interface AppHandle<S, Sel extends SelectorMap<S> = Record<string, never>> {
    createZone(name: string): ZoneHandle<S>;

    useComputed<T>(selector: (s: S) => T): T;
    getState(): S;
    setState(updater: (prev: S) => S): void;

    /** Create isolated test instance — dispatch(command(payload)) pattern */
    create(overrides?: Partial<S>): TestInstance<S>;
}

// ═══════════════════════════════════════════════════════════════════
// defineApp — entry point
// ═══════════════════════════════════════════════════════════════════

export function defineApp<
    S,
    Sel extends SelectorMap<S> = SelectorMap<S>,
>(
    appId: string,
    initialState: S,
    options?: {
        history?: boolean;
        persistence?: { key: string; debounceMs?: number };
        selectors?: Sel;
    },
): AppHandle<S, Sel> {
    // --- Runtime implementation (minimal for PoC) ---

    let currentState = { ...initialState };

    function createZone(name: string): ZoneHandle<S> {
        return {
            command<T extends string, P = void>(
                type: T,
                handler: FlatHandler<S, P>,
            ): CommandFactory<T, P> {
                // Create factory function
                const factory = ((...args: any[]) => {
                    const payload = args[0];
                    return { type, payload, __brand: "command" as const };
                }) as unknown as CommandFactory<T, P>;

                // Attach metadata
                Object.defineProperty(factory, "commandType", { value: type });

                return factory;
            },

            bind(config: ZoneBindings & { field?: FieldBindings }): BoundComponents {
                return {
                    Zone: (_props: any) => null,
                    Item: (_props: any) => null,
                    Field: (_props: any) => null,
                };
            },
        };
    }

    return {
        createZone,

        useComputed<T>(selector: (s: S) => T): T {
            return selector(currentState);
        },

        getState(): S {
            return currentState;
        },

        setState(updater: (prev: S) => S) {
            currentState = updater(currentState);
        },

        create(overrides?: Partial<S>): TestInstance<S> {
            let testState = overrides ? { ...initialState, ...overrides } : { ...initialState };

            return {
                get state() {
                    return testState;
                },
                dispatch<T extends string, P>(command: Command<T, P>) {
                    // In real impl: find handler by command.type and execute
                    void command;
                },
                reset() {
                    testState = overrides ? { ...initialState, ...overrides } : { ...initialState };
                },
            };
        },
    };
}
