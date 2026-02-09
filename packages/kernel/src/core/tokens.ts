/**
 * tokens — Typed tokens for the kernel API.
 *
 * - EffectToken<Type, Value>:   branded string for effect keys
 * - ScopeToken<Id>:             branded string for scope IDs
 * - ContextToken<Id, Value>:    wrapper object for context providers
 * - Command<Type, Payload>:     typed command object (created by CommandFactory)
 * - CommandFactory<Type, Payload>: function that creates a typed Command
 */

// ─── Brand Symbols (compile-time only) ───

declare const __effectBrand: unique symbol;
declare const __scopeBrand: unique symbol;
declare const __commandBrand: unique symbol;

// ─── Token Types ───

/** Effect token — branded string. Runtime value = effect ID string. */
export type EffectToken<
  Type extends string = string,
  Value = unknown,
> = Type & {
  readonly [__effectBrand]: Value;
};

/** Scope token — branded string. Runtime value = scope ID string. */
export type ScopeToken<Id extends string = string> = Id & {
  readonly [__scopeBrand]: true;
};

/** Context token — wrapper object. Phantom type carries Value information. */
export type ContextToken<Id extends string = string, Value = unknown> = {
  readonly __id: Id;
  /** @internal phantom — carries Value type at compile time only */
  readonly __phantom?: Value;
};

/** Typed command object. Created by CommandFactory, consumed by dispatch. */
export type Command<Type extends string = string, Payload = void> = {
  readonly type: Type;
  readonly payload: Payload;
  readonly scope?: ScopeToken[];
  readonly [__commandBrand]: true;
};

/** Factory function that creates a typed Command. */
export type CommandFactory<Type extends string = string, Payload = void> = {
  /** Creates a typed Command object. */
  (
    ...args: [Payload] extends [void]
      ? []
      : undefined extends Payload
        ? [payload?: Payload]
        : [payload: Payload]
  ): Command<Type, Payload>;
  /** The command type string (for debugging/inspection). */
  readonly commandType: Type;
};

// ─── Scope constants ───

/** The built-in root scope. Always the last element in any bubblePath. */
export const GLOBAL: ScopeToken<"GLOBAL"> = "GLOBAL" as ScopeToken<"GLOBAL">;

// ─── Helper Types ───

/** Forces TypeScript to eagerly resolve intersections and mapped types. */
type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Derives EffectMap fields from a record of EffectTokens.
 *
 * Given `{ NOTIFY: EffectToken<"NOTIFY", string>, TRACK: EffectToken<"TRACK", Event> }`:
 * → `{ NOTIFY?: string; TRACK?: Event }`
 */
export type EffectFields<E extends Record<string, EffectToken>> = {
  [K in keyof E as E[K] extends EffectToken<infer T, unknown>
    ? T
    : never]?: E[K] extends EffectToken<string, infer V> ? V : never;
};

/**
 * Full EffectMap type for a kernel with known effects.
 * Includes built-in fields (state, dispatch) + effect-derived fields.
 */
export type TypedEffectMap<S, E extends Record<string, EffectToken>> = {
  state?: S;
  dispatch?: Command | Command[];
} & EffectFields<E>;

/**
 * Derives injected context fields from ContextTokens (wrapper objects).
 *
 * Given [ContextToken<"NOW", number>, ContextToken<"USER", User>]:
 * → `{ NOW: number; USER: User }`
 */
export type InjectResult<T extends ContextToken[]> = Prettify<{
  [K in T[number] as K["__id"]]: K extends ContextToken<string, infer V>
    ? V
    : never;
}>;

/** Context passed to command handlers. state + injected values. */
export type TypedContext<
  S,
  Injected extends Record<string, unknown> = Record<string, never>,
> = Prettify<
  {
    readonly state: S;
  } & Readonly<Injected>
>;

// ─── Phantom State Marker ───

/** Phantom type marker for state type inference in createKernel. */
export type StateMarker<S> = { readonly __stateType?: S };

// ─── Internal Types (merged from internal-types.ts) ───

/** Internal command handler (curried: ctx → payload → effects) */
export type InternalCommandHandler = (ctx: any) => (payload?: any) => any;

/** Internal effect handler (untyped) */
export type InternalEffectHandler = (value: any) => void;

/** Middleware context (used by middleware hooks) */
export type MiddlewareContext = {
  command: Command;
  state: unknown;
  handlerScope: string;
  effects: Record<string, unknown> | null;
  injected: Record<string, unknown>;
};

/** Middleware type */
export type Middleware = {
  id: string;
  scope?: ScopeToken;
  before?: (ctx: MiddlewareContext) => MiddlewareContext;
  after?: (ctx: MiddlewareContext) => MiddlewareContext;
};
