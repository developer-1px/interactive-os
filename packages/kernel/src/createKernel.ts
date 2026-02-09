/**
 * createKernel — Zustand-style closure-based kernel factory.
 *
 * Each call creates a fully independent kernel instance.
 * No globalThis. No singletons. HMR-safe via module separation.
 *
 * @example
 *   const kernel = createKernel<AppState>({ count: 0 });
 *   const INC = kernel.defineCommand("INC", ctx => () => ({
 *     state: { ...ctx.state, count: ctx.state.count + 1 }
 *   }));
 *   kernel.dispatch(INC());
 */

import { useCallback, useRef, useSyncExternalStore } from "react";
import {
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
  type TypedEffectMap,
} from "./core/tokens.ts";
import { computeChanges, type Transaction } from "./core/transaction.ts";

type Listener = () => void;

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
  const scopedInterceptors = new Map<string, Map<string, Middleware[]>>();
  const scopedEffects = new Map<string, Map<string, InternalEffectHandler>>();
  const scopedMiddleware = new Map<string, Middleware[]>();

  // ─── Scope Tree (closure) ───
  // Records parent-child relationships from group() nesting.
  // Enables automatic bubble path expansion in dispatch().
  const parentMap = new Map<string, string>();

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
    console.warn(`[kernel] No context provider registered for "${id}"`);
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
    });
    if (transactions.length > MAX_TRANSACTIONS) {
      transactions.splice(0, transactions.length - MAX_TRANSACTIONS);
    }
  }

  function getTransactions(): readonly Transaction[] {
    return transactions;
  }

  function getLastTransaction(): Transaction | undefined {
    return transactions[transactions.length - 1];
  }

  function travelTo(transactionId: number): void {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) {
      console.warn(`[kernel] Transaction ${transactionId} not found`);
      return;
    }
    setState(() => tx.stateAfter as S);
  }

  function clearTransactions(): void {
    transactions.length = 0;
    txNextId = 0;
  }

  // ─── Dispatch Queue (closure) ───

  const queue: Command[] = [];
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
    cmd: Command<string, any>,
    options?: { scope?: ScopeToken[] },
  ): void {
    let enriched = options?.scope ? { ...cmd, scope: options.scope } : cmd;

    // Auto-expand single scope via parentMap
    if (enriched.scope?.length === 1) {
      const startScope = enriched.scope[0] as string;
      if (parentMap.has(startScope)) {
        enriched = { ...enriched, scope: buildBubblePath(startScope) };
      }
    }

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

  // ─── Command Processing ───

  function processCommand(cmd: Command, bubblePath?: ScopeToken[]): void {
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
      const injectedMap = mwCtx.injected;
      const ctx = {
        state: mwCtx.state,
        ...injectedMap,
        inject: (token: { __id: string }) => injectedMap[token.__id],
      };
      const handlerResult = handler(ctx)(mwCtx.command.payload);

      // 5. After-middleware (reverse order)
      mwCtx.effects = handlerResult as Record<string, unknown> | null;
      if (interceptors) {
        for (let i = interceptors.length - 1; i >= 0; i--) {
          if (interceptors[i].after) {
            mwCtx = interceptors[i].after?.(mwCtx) ?? mwCtx;
          }
        }
      }
      if (scopeMws) {
        for (let i = scopeMws.length - 1; i >= 0; i--) {
          if (scopeMws[i].after) {
            mwCtx = scopeMws[i].after?.(mwCtx) ?? mwCtx;
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
      executeEffects(result, path);
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
    );
  }

  // ─── Effect Execution ───

  function executeEffects(
    effectMap: Record<string, unknown>,
    scopePath: string[],
  ): void {
    for (const [key, value] of Object.entries(effectMap)) {
      if (value === undefined) continue;

      if (key === "state") {
        setState(() => value as S);
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
    }
  }

  // ─── Group Factory ───

  function createGroup<
    E extends Record<string, EffectToken>,
    Tokens extends ContextToken[],
  >(scope: string, injectTokens: Tokens) {
    type Ctx = TypedContext<S, InjectResult<Tokens>>;
    type EffMap = TypedEffectMap<S, E>;

    return {
      defineCommand: ((
        type: string,
        handlerOrTokens: InternalCommandHandler | ContextToken[],
        handlerArg?: InternalCommandHandler,
      ): CommandFactory<string, any> => {
        // Support 3-argument form: (type, tokens, handler)
        let handler: InternalCommandHandler;
        let perCommandTokens: ContextToken[];

        if (Array.isArray(handlerOrTokens)) {
          handler = handlerArg!;
          perCommandTokens = handlerOrTokens;
        } else {
          handler = handlerOrTokens;
          perCommandTokens = [];
        }

        // Register in scoped map
        if (!scopedCommands.has(scope)) {
          scopedCommands.set(scope, new Map());
        }
        const scopeMap = scopedCommands.get(scope)!;

        // HMR-safe: silent overwrite on re-registration
        scopeMap.set(type, handler);

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

          if (!scopedInterceptors.has(scope)) {
            scopedInterceptors.set(scope, new Map());
          }
          scopedInterceptors.get(scope)?.set(type, [injectMw]);
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
          handler: (ctx: Ctx) => () => EffMap | undefined,
        ): CommandFactory<T, void>;

        // With payload
        <T extends string, P>(
          type: T,
          handler: (ctx: Ctx) => (payload: P) => EffMap | undefined,
        ): CommandFactory<T, P>;

        // With per-command inject tokens (no payload)
        <T extends string>(
          type: T,
          tokens: ContextToken[],
          handler: (ctx: any) => () => EffMap | undefined,
        ): CommandFactory<T, void>;

        // With per-command inject tokens (with payload)
        <T extends string, P>(
          type: T,
          tokens: ContextToken[],
          handler: (ctx: any) => (payload: P) => EffMap | undefined,
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
        return type as EffectToken<T, V>;
      },

      defineContext,

      group<NewTokens extends ContextToken[] = []>(config: {
        scope?: ScopeToken;
        inject?: [...NewTokens];
      }) {
        const childScope = config.scope ? (config.scope as string) : scope;
        const childTokens = (config.inject ?? []) as NewTokens;

        // Record parent-child relationship in scope tree
        if (childScope !== scope) {
          parentMap.set(childScope, scope);
        }

        return createGroup<E, NewTokens>(childScope, childTokens);
      },

      use: registerMiddleware,

      dispatch,

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

    // Inspector
    getTransactions,
    getLastTransaction,
    clearTransactions,
    travelTo,

    // Scope Tree
    getScopePath(scope: ScopeToken): ScopeToken[] {
      return buildBubblePath(scope as string);
    },
    getScopeParent(scope: ScopeToken): ScopeToken | null {
      return (parentMap.get(scope as string) as ScopeToken) ?? null;
    },
  };
}
