/**
 * createKernel — Zustand-style closure-based kernel factory.
 *
 * Each call creates a fully independent kernel instance.
 * No globalThis. No singletons. HMR-safe via module separation.
 *
 * Inspector API is separated into createInspector.ts via Port/Adapter pattern.
 *
 * @example
 *   const kernel = createKernel<AppState>({ count: 0 });
 *   const INC = kernel.defineCommand("INC", ctx => () => ({
 *     state: { ...ctx.state, count: ctx.state.count + 1 }
 *   }));
 *   kernel.dispatch(INC());
 */

import { useCallback, useRef, useSyncExternalStore } from "react";

// ─── Logger Adapter ───
// Kernel-local logger. Defaults to console. No public API surface.
const logger = {
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

import type { KernelIntrospectionPort } from "./core/inspectorPort.ts";
import {
  type BaseCommand,
  type Command,
  type CommandFactory,
  type ContextToken,
  type EffectToken,
  GLOBAL,
  type InjectResult,
  type InternalCommandHandler,
  type InternalEffectHandler,
  type Middleware,
  type MiddlewareContext,
  type ScopeToken,
  type TypedContext,
} from "./core/tokens.ts";
import { computeChanges, type Transaction } from "./core/transaction.ts";
import { createInspector } from "./createInspector.ts";

type Listener = () => void;

/** Option to conditionally execute a command based on current state. */
type WhenGuardOption<S> = {
  when: (state: S) => boolean;
};

const MAX_TRANSACTIONS = 200;

/** Create a ScopeToken. No tree management — Kernel doesn't know about DOM. */
export function defineScope<Id extends string>(id: Id): ScopeToken<Id> {
  return id as ScopeToken<Id>;
}

/**
 * Create a Kernel instance — returns the root Group + store + inspector API.
 *
 * Zustand-style: each call creates an independent instance.
 * All state (store, registries, transactions) lives in closures.
 */
export function createKernel<S>(initialState: S) {
  // ─── Store (closure) ───

  let state: S = initialState;
  const listeners = new Set<Listener>();

  function getState(): S {
    return state;
  }

  function setState(updater: (prev: S) => S): void {
    state = updater(state);
    for (const listener of listeners) {
      listener();
    }
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  // ─── Registries (closure) ───

  const scopedCommands = new Map<string, Map<string, InternalCommandHandler>>();
  const perCommandMiddleware = new Map<string, Map<string, Middleware[]>>();
  const scopedEffects = new Map<string, Map<string, InternalEffectHandler>>();
  const scopedMiddleware = new Map<string, Middleware[]>();
  // when guard registry: scope → type → (state) => boolean
  const scopedWhenGuards = new Map<
    string,
    Map<string, (state: unknown) => boolean>
  >();

  // ─── Scope Tree (closure) ───
  // Records parent-child relationships from group() nesting.
  // Enables automatic bubble path expansion in dispatch().
  const parentMap = new Map<string, string>();

  // ─── State Lens (closure) ───
  // Per-scope get/set for state isolation (ownership scoping).
  // If a scope has a lens, its handlers see only the scoped slice.
  type StateLens = {
    get: (full: S) => unknown;
    set: (full: S, slice: unknown) => S;
  };
  const scopeStateLens = new Map<string, StateLens>();

  // ─── Context Providers (closure) ───

  const contextProviders = new Map<string, () => unknown>();

  function defineContext<Id extends string, V>(
    id: Id,
    provider: () => V,
  ): ContextToken<Id, V> {
    contextProviders.set(id, provider);
    return { __id: id } as ContextToken<Id, V>;
  }

  function resolveContext(id: string): unknown {
    const provider = contextProviders.get(id);
    if (provider) return provider();
    logger.warn(`[kernel] No context provider registered for "${id}"`);
    return undefined;
  }

  // ─── Transaction Log (closure) ───

  const transactions: Transaction[] = [];
  let txNextId = 0;

  function recordTransaction(
    command: Command,
    handlerScope: string,
    effects: Record<string, unknown> | null,
    stateBefore: unknown,
    stateAfter: unknown,
    bubblePath: string[],
    meta?: Record<string, unknown>,
  ): void {
    const id = txNextId++;
    transactions.push({
      id,
      timestamp: Date.now(),
      command,
      handlerScope,
      bubblePath,
      effects,
      changes: computeChanges(stateBefore, stateAfter),
      stateBefore,
      stateAfter,
      ...(meta !== undefined ? { meta } : {}),
    });
    if (transactions.length > MAX_TRANSACTIONS) {
      transactions.splice(0, transactions.length - MAX_TRANSACTIONS);
    }
  }

  function getTransactions(): readonly Transaction[] {
    return transactions;
  }

  function getLastTransaction(): Transaction | null {
    return transactions[transactions.length - 1] ?? null;
  }

  function travelTo(transactionId: number): void {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) {
      logger.warn(`[kernel] Transaction ${transactionId} not found`);
      return;
    }
    setState(() => tx.stateAfter as S);
  }

  function clearTransactions(): void {
    transactions.length = 0;
    txNextId = 0;
  }

  // ─── Dispatch Queue (closure) ───

  const queue: Array<{ cmd: Command; meta?: Record<string, unknown> }> = [];
  let processing = false;

  // Build full bubble path by walking parentMap upward.
  function buildBubblePath(startScope: string): ScopeToken[] {
    const path: string[] = [startScope];
    let current = startScope;
    while (parentMap.has(current)) {
      current = parentMap.get(current)!;
      path.push(current);
    }
    if (path[path.length - 1] !== (GLOBAL as string)) {
      path.push(GLOBAL as string);
    }
    return path as ScopeToken[];
  }

  function dispatch(
    cmd: BaseCommand,
    options?: { scope?: ScopeToken[]; meta?: Record<string, unknown> },
  ): void {
    let enriched = options?.scope ? { ...cmd, scope: options.scope } : cmd;

    // Auto-expand single scope via parentMap
    if (enriched.scope?.length === 1) {
      const startScope = enriched.scope[0] as string;
      if (parentMap.has(startScope)) {
        enriched = { ...enriched, scope: buildBubblePath(startScope) };
      }
    }

    queue.push({
      cmd: enriched as Command,
      ...(options?.meta !== undefined ? { meta: options.meta } : {}),
    });

    if (processing) return;

    processing = true;
    try {
      while (queue.length > 0) {
        const next = queue.shift()!;
        processCommand(next.cmd, next.cmd.scope, next.meta);
      }
    } finally {
      processing = false;
    }
  }

  // ─── Command Processing ───

  function processCommand(
    cmd: Command,
    bubblePath?: ScopeToken[],
    meta?: Record<string, unknown>,
  ): void {
    const stateBefore = state;
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
        state: state as unknown,
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

      // 2.5. when guard — dispatch guard (W26/W33)
      const whenMap = scopedWhenGuards.get(currentScope);
      const whenGuard = whenMap?.get(resolvedType);
      if (whenGuard) {
        const guardLens = scopeStateLens.get(currentScope);
        const guardState = guardLens ? guardLens.get(state) : state;
        if (!whenGuard(guardState)) continue; // guard failed → bubble up
      }

      // 3. Per-command middleware (inject DI tokens)
      const perCmdMwMap = perCommandMiddleware.get(currentScope);
      const perCmdMws = perCmdMwMap?.get(resolvedType);
      if (perCmdMws) {
        for (const ic of perCmdMws) {
          if (ic.before) {
            mwCtx = ic.before(mwCtx);
          }
        }
      }

      // 4. Execute handler
      //    State lens: scope with a registered lens sees only its slice
      const lens = scopeStateLens.get(currentScope);
      const scopedState = lens ? lens.get(mwCtx.state as S) : mwCtx.state;
      const injectedMap = mwCtx.injected;
      const ctx = {
        state: scopedState,
        ...injectedMap,
        inject: (token: { __id: string }) => injectedMap[token.__id],
      };
      const handlerResult = handler(ctx)(mwCtx.command.payload);

      // 5. After-middleware (reverse order)
      mwCtx.effects = handlerResult as Record<string, unknown> | null;
      if (perCmdMws) {
        for (let i = perCmdMws.length - 1; i >= 0; i--) {
          const ic = perCmdMws[i];
          if (ic?.after) {
            mwCtx = ic.after(mwCtx) ?? mwCtx;
          }
        }
      }
      if (scopeMws) {
        for (let i = scopeMws.length - 1; i >= 0; i--) {
          const mw = scopeMws[i];
          if (mw?.after) {
            mwCtx = mw.after(mwCtx) ?? mwCtx;
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

    // 7. Execute effects (pass handlerScope for state lens merging)
    if (result) {
      executeEffects(result, path, handlerScope);
    }

    const stateAfter = state;

    // 8. Record transaction
    recordTransaction(
      resolvedCommand,
      handlerScope,
      result,
      stateBefore,
      stateAfter,
      path,
      meta,
    );
  }

  // ─── Effect Execution ───

  function executeEffects(
    effectMap: Record<string, unknown>,
    scopePath: string[],
    handlerScope?: string,
  ): void {
    for (const [key, value] of Object.entries(effectMap)) {
      if (value === undefined) continue;

      if (key === "state") {
        // State lens: scoped handlers return only their slice → merge back
        const lens = handlerScope
          ? scopeStateLens.get(handlerScope)
          : undefined;
        if (lens) {
          setState((prev) => lens.set(prev, value));
        } else {
          setState(() => value as S);
        }
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
          logger.error(`[kernel] Effect "${key}" threw:`, err);
        }
      } else {
        logger.warn(`[kernel] Unknown effect "${key}" in EffectMap`);
      }
    }
  }

  // ─── Middleware Registration ───

  function registerMiddleware(middleware: Middleware): void {
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
      inspector.invalidateRegistry();
    }
  }

  // ─── Fallback Resolution ───

  /**
   * resolveFallback — Side channel for listener miss → middleware fallback.
   *
   * Iterates GLOBAL middleware fallback hooks with the native Event.
   * If a middleware returns a Command, dispatches it and returns true.
   * Does NOT record its own transaction (dispatch handles that).
   *
   * Pattern: keyboard/mouse/clipboard — listener resolves first,
   * misses delegate to kernel middleware via this API.
   */
  function resolveFallback(event: Event): boolean {
    const globalMws = scopedMiddleware.get(GLOBAL as string);
    if (!globalMws) return false;

    for (const mw of globalMws) {
      if (!mw.fallback) continue;
      const command = mw.fallback(event);
      if (command) {
        dispatch(command);
        return true;
      }
    }
    return false;
  }

  // ─── Group Factory ───

  function createGroup<
    E extends Record<string, EffectToken>,
    Tokens extends ContextToken[],
  >(scope: string, injectTokens: Tokens) {
    type Ctx = TypedContext<S, InjectResult<Tokens>>;
    // Loose return type: allows scoped state types (e.g., Todo's AppState ≠ kernel AppState)
    // The runtime stateSlice lens handles proper state mapping regardless
    type HandlerReturn = {
      state?: unknown;
      dispatch?: BaseCommand | BaseCommand[];
    } & Record<string, unknown>;

    return {
      defineCommand: ((
        type: string,
        handlerOrTokens: InternalCommandHandler | ContextToken[],
        handlerArg?: InternalCommandHandler,
        optionsArg?: { when?: (state: unknown) => boolean },
      ): CommandFactory<string, any> => {
        // Support 3-argument form: (type, tokens, handler)
        let handler: InternalCommandHandler;
        let perCommandTokens: ContextToken[];
        let whenOptions: { when?: (state: unknown) => boolean } | undefined;

        if (Array.isArray(handlerOrTokens)) {
          handler = handlerArg!;
          perCommandTokens = handlerOrTokens;
          whenOptions = optionsArg;
        } else {
          handler = handlerOrTokens;
          perCommandTokens = [];
          // When no tokens: (type, handler, options?)
          whenOptions = handlerArg as unknown as
            | { when?: (state: unknown) => boolean }
            | undefined;
        }

        // Register in scoped map
        if (!scopedCommands.has(scope)) {
          scopedCommands.set(scope, new Map());
        }
        const scopeMap = scopedCommands.get(scope)!;

        // HMR-safe: silent overwrite on re-registration
        scopeMap.set(type, handler);
        inspector.invalidateRegistry();

        // Register when guard (W26/W33)
        if (whenOptions?.when) {
          if (!scopedWhenGuards.has(scope)) {
            scopedWhenGuards.set(scope, new Map());
          }
          scopedWhenGuards.get(scope)!.set(type, whenOptions.when);
        }

        // Register inject interceptor for this command
        // Merge group-level tokens with per-command tokens
        const allTokens = [...injectTokens, ...perCommandTokens];
        if (allTokens.length > 0) {
          const injectMw: Middleware = {
            id: `inject:${scope}:${type}`,
            before: (ctx: MiddlewareContext): MiddlewareContext => {
              const injected = { ...ctx.injected };
              for (const token of allTokens) {
                const id = (token as ContextToken).__id;
                injected[id] = resolveContext(id);
              }
              return { ...ctx, injected };
            },
          };

          if (!perCommandMiddleware.has(scope)) {
            perCommandMiddleware.set(scope, new Map());
          }
          perCommandMiddleware.get(scope)?.set(type, [injectMw]);
        }

        // Return CommandFactory (self-describing: carries handler + tokens)
        const factory = (payload?: unknown) =>
          ({
            type,
            payload,
            scope:
              scope !== (GLOBAL as string) ? [scope as ScopeToken] : undefined,
          }) as unknown as Command<string, any>;

        (factory as unknown as { commandType: string }).commandType = type;
        (factory as unknown as { id: string }).id = type;
        (factory as unknown as { handler: InternalCommandHandler }).handler = handler;
        (factory as unknown as { tokens: ContextToken[] }).tokens = perCommandTokens;

        return factory as unknown as CommandFactory<string, any>;
      }) as {
        // No payload
        <T extends string>(
          type: T,
          handler: (ctx: Ctx) => () => HandlerReturn | undefined,
          options?: WhenGuardOption<S>,
        ): CommandFactory<T, void>;

        // With payload
        <T extends string, P>(
          type: T,
          handler: (ctx: Ctx) => (payload: P) => HandlerReturn | undefined,
          options?: WhenGuardOption<S>,
        ): CommandFactory<T, P>;

        // With per-command inject tokens (no payload)
        <T extends string>(
          type: T,
          tokens: ContextToken[],
          handler: (ctx: any) => () => HandlerReturn | undefined,
          options?: WhenGuardOption<S>,
        ): CommandFactory<T, void>;

        // With per-command inject tokens (with payload)
        <T extends string, P>(
          type: T,
          tokens: ContextToken[],
          handler: (ctx: any) => (payload: P) => HandlerReturn | undefined,
          options?: WhenGuardOption<S>,
        ): CommandFactory<T, P>;
      },

      defineEffect<T extends string, V>(
        type: T,
        handler: (value: V) => void,
      ): EffectToken<T, V> {
        if (!scopedEffects.has(scope)) {
          scopedEffects.set(scope, new Map());
        }
        scopedEffects.get(scope)?.set(type, handler as InternalEffectHandler);
        inspector.invalidateRegistry();
        return type as EffectToken<T, V>;
      },

      defineContext,

      group<NewTokens extends ContextToken[] = []>(config: {
        scope?: ScopeToken;
        inject?: [...NewTokens];
        /** State lens for scope isolation. Handlers see only the scoped slice. */
        stateSlice?: {
          get: (full: S) => unknown;
          set: (full: S, slice: unknown) => S;
        };
      }) {
        const childScope = config.scope ? (config.scope as string) : scope;
        const childTokens = (config.inject ?? []) as NewTokens;

        // Record parent-child relationship in scope tree
        if (childScope !== scope) {
          parentMap.set(childScope, scope);
          inspector.invalidateRegistry();
        }

        // Register state lens for this scope (inherit parent lens if not provided)
        if (config.stateSlice) {
          scopeStateLens.set(childScope, config.stateSlice);
        } else if (childScope !== scope && scopeStateLens.has(scope)) {
          // Inherit parent's state lens so zone commands see the same slice
          scopeStateLens.set(childScope, scopeStateLens.get(scope)!);
        }

        return createGroup<E, NewTokens>(childScope, childTokens);
      },

      use: registerMiddleware,

      dispatch,

      /**
       * Register an external CommandFactory's handler on this kernel.
       * Reads .handler, .tokens, .commandType from the factory.
       * Enables test kernels to use production handlers without duplication.
       */
      register(factory: CommandFactory<string, any>): CommandFactory<string, any> {
        const { commandType: type, handler, tokens } = factory;
        if (tokens && tokens.length > 0) {
          return this.defineCommand(type, tokens, handler);
        }
        return this.defineCommand(type, handler);
      },

      reset(newInitialState: S): void {
        setState(() => newInitialState);
        clearTransactions();
      },
    };
  }

  // ─── Root Group ───

  const root = createGroup<Record<string, EffectToken>, []>(
    GLOBAL as string,
    [],
  );

  // ─── useComputed (React Hook) ───

  function useComputed<T>(selector: (state: S) => T): T {
    const selectorRef = useRef(selector);
    selectorRef.current = selector;

    const getSnapshot = useCallback(
      () => selectorRef.current(getState()),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  // ─── Inspector Port (narrow read-only window into kernel internals) ───

  const introspectionPort: KernelIntrospectionPort<S> = {
    getState: () => state,

    getCommandTypes(scope: ScopeToken): readonly string[] {
      return Array.from(scopedCommands.get(scope as string)?.keys() ?? []);
    },
    getWhenGuardTypes(scope: ScopeToken): readonly string[] {
      return Array.from(scopedWhenGuards.get(scope as string)?.keys() ?? []);
    },
    getMiddlewareIds(scope: ScopeToken): readonly string[] {
      return (scopedMiddleware.get(scope as string) ?? []).map((m) => m.id);
    },
    getEffectTypes(scope: ScopeToken): readonly string[] {
      return Array.from(scopedEffects.get(scope as string)?.keys() ?? []);
    },
    getAllScopes(): readonly ScopeToken[] {
      const all = new Set<string>();
      for (const s of scopedCommands.keys()) all.add(s);
      for (const s of scopedEffects.keys()) all.add(s);
      for (const s of scopedMiddleware.keys()) all.add(s);
      for (const s of scopedWhenGuards.keys()) all.add(s);
      for (const [child, parent] of parentMap) {
        all.add(child);
        all.add(parent);
      }
      return Array.from(all) as ScopeToken[];
    },
    getScopeParent(scope: ScopeToken): ScopeToken | null {
      return (parentMap.get(scope as string) as ScopeToken) ?? null;
    },
    getScopePath(scope: ScopeToken): readonly ScopeToken[] {
      return buildBubblePath(scope as string);
    },
    evaluateWhenGuard(scope: ScopeToken, type: string): boolean | null {
      const whenMap = scopedWhenGuards.get(scope as string);
      const guard = whenMap?.get(type);
      if (!guard) return null;
      const lens = scopeStateLens.get(scope as string);
      const guardState = lens ? lens.get(state) : state;
      return guard(guardState);
    },
    getTransactions,
    getLastTransaction,
    clearTransactions,
    travelTo,
  };

  const inspector = createInspector(introspectionPort);

  // ─── Return Kernel Instance ───

  return {
    // Group API (root)
    ...root,

    // Store
    getState,
    setState,
    subscribe,

    // React
    useComputed,

    // Inspector (separated via Port/Adapter)
    inspector,

    // Fallback
    resolveFallback,
  };
}
