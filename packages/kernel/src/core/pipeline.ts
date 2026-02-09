/**
 * pipeline — Dispatch queue, command processing, effect execution, and middleware registration.
 */

import { getActiveStore } from "./createStore.ts";
import {
  scopedCommands,
  scopedEffects,
  scopedInterceptors,
  scopedMiddleware,
} from "./registries.ts";
import type {
  InternalEffectHandler,
  Middleware,
  MiddlewareContext,
} from "./tokens.ts";
import { type Command, GLOBAL, type ScopeToken } from "./tokens.ts";
import { recordTransaction } from "./transaction.ts";

// ─── Dispatch Queue ───

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

// ─── Command Processing ───

export function processCommand(cmd: Command, bubblePath?: ScopeToken[]): void {
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
    const handlerResult = handler(ctx)(mwCtx.command.payload);

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

// ─── Effect Execution ───

export function executeEffects(
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

// ─── Middleware Registration ───

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
