/**
 * registry — Unified Group API for the kernel.
 *
 * createKernel(config) → Group (root = "__GLOBAL__" scope)
 * Group.group(config)  → Group (child scope, inherits S and E)
 *
 * Group = {
 *   defineCommand(type, handler) → CommandFactory
 *   defineEffect(type, handler)  → EffectToken
 *   defineContext(id, provider)  → ContextToken
 *   group(config)                → Group (child)
 *   dispatch(cmd)                → void
 *   use(middleware)              → void
 *   reset(initialState)          → void
 * }
 */

import { defineContext as _defineContext, resolveContext } from "./context.ts";
import type {
  Command,
  CommandFactory,
  ContextToken,
  EffectToken,
  InjectResult,
  ScopeToken,
  TypedContext,
  TypedEffectMap,
} from "./tokens.ts";
import { GLOBAL } from "./tokens.ts";

// ─── Internal Types ───

/** Internal command handler (untyped — typing is enforced at registration) */
type InternalCommandHandler = (ctx: any, payload?: any) => any;

/** Internal effect handler (untyped) */
type InternalEffectHandler = (value: any) => void;

/** Middleware type */
export type Middleware = {
  id: string;
  scope?: ScopeToken;
  before?: (ctx: MiddlewareContext) => MiddlewareContext;
  after?: (ctx: MiddlewareContext) => MiddlewareContext;
};

/** Middleware context (used by middleware hooks) */
export type MiddlewareContext = {
  command: Command;
  state: unknown;
  handlerScope: string;
  effects: Record<string, unknown> | null;
  injected: Record<string, unknown>;
};

// ─── Registries ───

/** scopeId → commandType → handler */
const scopedCommands = new Map<string, Map<string, InternalCommandHandler>>();

/** scopeId → commandType → interceptors */
const scopedInterceptors = new Map<string, Map<string, Middleware[]>>();

/** scopeId → effectType → handler (scoped effects with bubbling) */
const scopedEffects = new Map<string, Map<string, InternalEffectHandler>>();

// ─── defineScope ───

/**
 * Create a ScopeToken. No tree management — Kernel doesn't know about DOM.
 *
 * @example
 *   const CARD_LIST = defineScope("CARD_LIST");
 */
export function defineScope<Id extends string>(id: Id): ScopeToken<Id> {
  return id as ScopeToken<Id>;
}

// ─── Phantom State Marker ───

/** Phantom type marker for state type inference in createKernel. */
export type StateMarker<S> = { readonly __stateType?: S };

/** Create a phantom state type marker. No runtime cost. */
export function state<S>(): StateMarker<S> {
  return {} as StateMarker<S>;
}

// ─── createKernel ───

/**
 * Create a Kernel instance — returns the root Group.
 *
 * The kernel is itself a Group at GLOBAL scope with no inject.
 *
 * @example
 *   const kernel = createKernel({ state: state<AppState>(), effects: { NOTIFY } });
 *   const CMD = kernel.defineCommand("CMD", (ctx) => ({
 *     state: { ...ctx.state, count: ctx.state.count + 1 },
 *     [NOTIFY]: "hello",
 *   }));
 */
export function createKernel<
  E extends Record<string, EffectToken> = Record<string, never>,
  S = unknown,
>(_config: { state?: StateMarker<S>; effects?: E }) {
  return createGroup<S, E, []>(GLOBAL as string, []);
}

// ─── Group Factory ───

function createGroup<
  S,
  E extends Record<string, EffectToken>,
  Tokens extends ContextToken[],
>(scope: string, injectTokens: Tokens) {
  type Ctx = TypedContext<S, InjectResult<Tokens>>;
  type EffMap = TypedEffectMap<S, E>;

  return {
    /**
     * Register a command handler.
     */
    defineCommand: ((
      type: string,
      handler: InternalCommandHandler,
    ): CommandFactory<string, any> => {
      // Register in scoped map
      if (!scopedCommands.has(scope)) {
        scopedCommands.set(scope, new Map());
      }
      const scopeMap = scopedCommands.get(scope)!;

      if (scopeMap.has(type)) {
        console.warn(
          `[kernel] command "${type}" at scope "${scope}" is being overwritten`,
        );
      }
      scopeMap.set(type, handler);

      // Register inject interceptor for this command (if tokens exist)
      if (injectTokens.length > 0) {
        const injectMw: Middleware = {
          id: `inject:${scope}:${type}`,
          before: (ctx: MiddlewareContext): MiddlewareContext => {
            const injected = { ...ctx.injected };
            for (const token of injectTokens) {
              const id = (token as ContextToken).__id;
              injected[id] = resolveContext(id);
            }
            return { ...ctx, injected };
          },
        };

        if (!scopedInterceptors.has(scope)) {
          scopedInterceptors.set(scope, new Map());
        }
        scopedInterceptors.get(scope)!.set(type, [injectMw]);
      }

      // Return CommandFactory
      const factory = (payload?: unknown) =>
        ({
          type,
          payload,
          scope:
            scope !== (GLOBAL as string) ? [scope as ScopeToken] : undefined,
        }) as unknown as Command<string, any>;

      (factory as unknown as { commandType: string }).commandType = type;

      return factory as unknown as CommandFactory<string, any>;
    }) as {
      // No payload
      <T extends string>(
        type: T,
        handler: (ctx: Ctx) => EffMap | void,
      ): CommandFactory<T, void>;

      // With payload
      <T extends string, P>(
        type: T,
        handler: (ctx: Ctx, payload: P) => EffMap | void,
      ): CommandFactory<T, P>;
    },

    /**
     * Register a side-effect handler in this group's scope.
     */
    defineEffect<T extends string, V>(
      type: T,
      handler: (value: V) => void,
    ): EffectToken<T, V> {
      if (!scopedEffects.has(scope)) {
        scopedEffects.set(scope, new Map());
      }
      scopedEffects.get(scope)!.set(type, handler as InternalEffectHandler);
      return type as EffectToken<T, V>;
    },

    /**
     * Register a context provider in this group's scope.
     */
    defineContext: _defineContext,

    /**
     * Create a child group with a new scope and/or inject tokens.
     */
    group<NewTokens extends ContextToken[] = []>(config: {
      scope?: ScopeToken;
      inject?: [...NewTokens];
    }) {
      const childScope = config.scope ? (config.scope as string) : scope;
      const childTokens = (config.inject ?? []) as NewTokens;
      return createGroup<S, E, NewTokens>(childScope, childTokens);
    },

    /**
     * Register a scoped or global middleware.
     */
    use(middleware: Middleware): void {
      registerMiddleware(middleware);
    },

    /**
     * Dispatch a typed command.
     */
    dispatch,

    /**
     * Reset state without clearing registries.
     * Commands and effects remain registered — only the store state is replaced.
     * Safe for React Strict Mode (idempotent).
     */
    reset(initialState: S): void {
      const store = getActiveStore();
      if (store) {
        store.setState(() => initialState as unknown);
      }
      clearTransactions();
    },
  };
}

// ─── Middleware Registry ───

const scopedMiddleware = new Map<string, Middleware[]>();

export function registerMiddleware(middleware: Middleware): void {
  const mwScope = (middleware.scope as string) ?? (GLOBAL as string);

  if (!scopedMiddleware.has(mwScope)) {
    scopedMiddleware.set(mwScope, []);
  }

  const list = scopedMiddleware.get(mwScope)!;

  // Dedup by id within scope
  const existing = list.findIndex((m) => m.id === middleware.id);
  if (existing !== -1) {
    list[existing] = middleware;
  } else {
    list.push(middleware);
  }
}

// ─── Dispatch ───

import { getActiveStore } from "./store.ts";
import { clearTransactions, recordTransaction } from "./transaction.ts";

const queue: Command[] = [];
let processing = false;

/**
 * dispatch — the single entry point.
 * Accepts a typed Command (created by CommandFactory).
 */
export function dispatch(
  cmd: Command<string, any>,
  options?: { scope?: ScopeToken[] },
): void {
  // Attach scope to command for processing
  const enriched = options?.scope ? { ...cmd, scope: options.scope } : cmd;
  queue.push(enriched as Command);

  if (processing) return;

  processing = true;
  try {
    while (queue.length > 0) {
      const next = queue.shift()!;
      processCommand(next, next.scope);
    }
  } finally {
    processing = false;
  }
}

function processCommand(cmd: Command, bubblePath?: ScopeToken[]): void {
  const store = getActiveStore();
  if (!store) {
    throw new Error("[kernel] No store bound. Call bindStore() first.");
  }

  const stateBefore = store.getState();
  const path: string[] = bubblePath
    ? (bubblePath as unknown as string[])
    : [GLOBAL as string];

  let result: Record<string, unknown> | null = null;
  let handlerScope = "unknown";
  let resolvedCommand: Command = cmd;

  for (const currentScope of path) {
    // 1. Scope before-middleware
    let mwCtx: MiddlewareContext = {
      command: cmd,
      state: store.getState(),
      handlerScope: currentScope,
      effects: null,
      injected: {},
    };

    const scopeMws = scopedMiddleware.get(currentScope);
    if (scopeMws) {
      for (const mw of scopeMws) {
        if (mw.before) {
          mwCtx = mw.before(mwCtx);
        }
      }
    }

    // 2. Handler lookup at this scope
    const resolvedType = mwCtx.command.type;
    const scopeMap = scopedCommands.get(currentScope);
    const handler = scopeMap?.get(resolvedType);

    if (!handler) continue;

    // 3. Per-command interceptors (inject middleware)
    const interceptorsMap = scopedInterceptors.get(currentScope);
    const interceptors = interceptorsMap?.get(resolvedType);
    if (interceptors) {
      for (const ic of interceptors) {
        if (ic.before) {
          mwCtx = ic.before(mwCtx);
        }
      }
    }

    // 4. Execute handler
    const ctx = { state: mwCtx.state, ...mwCtx.injected };
    const handlerResult = handler(ctx, mwCtx.command.payload);

    // 5. Scope after-middleware
    mwCtx.effects = handlerResult as Record<string, unknown> | null;
    if (interceptors) {
      for (let i = interceptors.length - 1; i >= 0; i--) {
        if (interceptors[i].after) {
          mwCtx = interceptors[i].after!(mwCtx);
        }
      }
    }
    if (scopeMws) {
      for (let i = scopeMws.length - 1; i >= 0; i--) {
        if (scopeMws[i].after) {
          mwCtx = scopeMws[i].after!(mwCtx);
        }
      }
    }

    result = mwCtx.effects;
    resolvedCommand = mwCtx.command;

    // 6. Bubble or stop
    if (result === null) continue; // handler returned null → bubble
    handlerScope = currentScope;
    break; // handled → stop
  }

  // 7. Execute effects
  if (result) {
    executeEffects(result, store, path);
  }

  const stateAfter = store.getState();

  // 8. Record transaction
  recordTransaction(
    resolvedCommand,
    handlerScope,
    result,
    stateBefore,
    stateAfter,
    path,
  );
}

function executeEffects(
  effectMap: Record<string, unknown>,
  store: { setState: (fn: (s: unknown) => unknown) => void },
  scopePath: string[],
): void {
  for (const [key, value] of Object.entries(effectMap)) {
    if (value === undefined) continue;

    if (key === "state") {
      store.setState(() => value);
      continue;
    }

    if (key === "dispatch") {
      const cmds = Array.isArray(value) ? value : [value];
      for (const c of cmds as Command[]) {
        dispatch(c);
      }
      continue;
    }

    // Custom effects — resolve through scope chain (bubble)
    let effectHandler: InternalEffectHandler | undefined;
    for (const effectScope of scopePath) {
      effectHandler = scopedEffects.get(effectScope)?.get(key);
      if (effectHandler) break;
    }
    // Fallback to GLOBAL
    if (!effectHandler) {
      effectHandler = scopedEffects.get(GLOBAL as string)?.get(key);
    }

    if (effectHandler) {
      try {
        effectHandler(value);
      } catch (err) {
        console.error(`[kernel] Effect "${key}" threw:`, err);
      }
    } else {
      console.warn(`[kernel] Unknown effect "${key}" in EffectMap`);
    }
  }
}

// ─── Internal Lookups ───

export function getScopedCommand(
  type: string,
  scope: string,
): InternalCommandHandler | undefined {
  return scopedCommands.get(scope)?.get(type);
}

export function getScopedMiddleware(scope: string): Middleware[] | undefined {
  return scopedMiddleware.get(scope);
}

// ─── Debug / Testing ───

export function clearAllRegistries(): void {
  scopedCommands.clear();
  scopedInterceptors.clear();
  scopedEffects.clear();
  scopedMiddleware.clear();
}
