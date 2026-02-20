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

/**
 * Generic command interface for storage and dispatch.
 * Any Command<T,P> is naturally assignable to this (structural subtype).
 * Used where the concrete command type is unknown (e.g., EffectMap.dispatch, ZoneEntry).
 */
export interface BaseCommand {
  readonly type: string;
  readonly payload?: unknown;
  readonly scope?: ScopeToken[];
}

/** Factory function that creates a typed Command. */
export type CommandFactory<Type extends string = string, Payload = void> = {
  /** Creates a typed Command object. */
  (payload: Payload): Command<Type, Payload>;
  /** The command type string (for debugging/inspection). */
  readonly commandType: Type;
  /** Alias for commandType — matches FieldCommandFactory interface. */
  readonly id: string;
  /** The handler function. Enables registration on any kernel instance. */
  readonly handler: InternalCommandHandler;
  /** Context tokens required by this command (for DI injection). */
  readonly tokens: ContextToken[];
};

// ─── Scope constants ───

/** The built-in root scope. Always the last element in any bubblePath. */
export const GLOBAL: ScopeToken<"GLOBAL"> = "GLOBAL" as ScopeToken<"GLOBAL">;

// ─── Helper Types ───

/** Forces TypeScript to eagerly resolve intersections and mapped types. */
type Prettify<T> = { [K in keyof T]: T[K] } & {};

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

/**
 * Context with inject() method — for commands with per-command tokens.
 * Unlike TypedContext (which flattens injected values), this provides
 * a typed inject() method that preserves ContextToken phantom types.
 */
export type InjectableContext<S> = {
  readonly state: S;
  inject<Id extends string, V>(token: ContextToken<Id, V>): V;
};

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
  /** Fallback hook — called by resolveFallback(event) when a listener misses.
   *  Return a Command to handle, or null to pass to the next middleware. */
  fallback?: (event: Event) => BaseCommand | null;
};
