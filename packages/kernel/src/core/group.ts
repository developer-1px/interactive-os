import { defineContext as _defineContext, resolveContext } from "./context.ts";
import { dispatch } from "./dispatch.ts";
import type {
  InternalCommandHandler,
  InternalEffectHandler,
  Middleware,
  MiddlewareContext,
} from "./internal-types.ts";
import { registerMiddleware } from "./middleware.ts";
import {
  scopedCommands,
  scopedEffects,
  scopedInterceptors,
} from "./registries.ts";
import { getActiveStore } from "./store.ts";
import {
  type Command,
  type CommandFactory,
  type ContextToken,
  type EffectToken,
  GLOBAL,
  type InjectResult,
  type ScopeToken,
  type TypedContext,
  type TypedEffectMap,
} from "./tokens.ts";
import { clearTransactions } from "./transaction.ts";

export function createGroup<
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
        handler: (ctx: Ctx) => () => EffMap | void,
      ): CommandFactory<T, void>;

      // With payload
      <T extends string, P>(
        type: T,
        handler: (ctx: Ctx) => (payload: P) => EffMap | void,
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
