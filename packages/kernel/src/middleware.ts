/**
 * middleware — Global interceptor chain.
 *
 * Middlewares wrap the dispatch pipeline:
 *   before hooks → handler/command → after hooks (reverse order)
 *
 * Two levels:
 *   - Global: registered via use(), runs on every dispatch.
 *   - Per-command: passed to defineHandler/defineCommand, runs only for that command.
 *
 * Execution order:
 *   global-A:before → global-B:before → per-cmd-X:before → handler → per-cmd-X:after → global-B:after → global-A:after
 */

import type { Command, EffectMap } from "./registry.ts";

// ─── Types ───

export type MiddlewareCtx = {
  /** The command being dispatched */
  command: Command;
  /** Current DB state (before handler) */
  db: unknown;
  /** Handler type that was matched */
  handlerType: "handler" | "command" | "unknown";
  /** Effects returned by command handler (null for defineHandler) */
  effects: EffectMap | null;
  /** Injected context values (populated by inject() middleware) */
  injected: Record<string, unknown>;
};

export type Middleware = {
  id: string;
  /** Runs before handler execution. Can modify command or inject context. */
  before?: (ctx: MiddlewareCtx) => MiddlewareCtx;
  /** Runs after handler execution (reverse order). Can modify effects. */
  after?: (ctx: MiddlewareCtx) => MiddlewareCtx;
};

// ─── Registry ───

const middlewares: Middleware[] = [];

/**
 * use — register a global middleware.
 *
 * Middlewares execute in registration order (before) and reverse order (after).
 */
export function use(middleware: Middleware): void {
  // Prevent duplicate by id
  const existing = middlewares.findIndex((m) => m.id === middleware.id);
  if (existing !== -1) {
    middlewares[existing] = middleware;
    return;
  }
  middlewares.push(middleware);
}

/**
 * runChain — execute a combined middleware chain (global + per-command).
 *
 * Before hooks run in order, after hooks run in reverse order.
 */
export function runBeforeChain(
  ctx: MiddlewareCtx,
  perCommand?: Middleware[],
): MiddlewareCtx {
  let current = ctx;
  // Global middlewares first
  for (const mw of middlewares) {
    if (mw.before) {
      current = mw.before(current);
    }
  }
  // Per-command interceptors second (closer to handler)
  if (perCommand) {
    for (const mw of perCommand) {
      if (mw.before) {
        current = mw.before(current);
      }
    }
  }
  return current;
}

export function runAfterChain(
  ctx: MiddlewareCtx,
  perCommand?: Middleware[],
): MiddlewareCtx {
  let current = ctx;
  // Per-command interceptors first (reverse order, unwinding)
  if (perCommand) {
    for (let i = perCommand.length - 1; i >= 0; i--) {
      const mw = perCommand[i];
      if (mw.after) {
        current = mw.after(current);
      }
    }
  }
  // Global middlewares second (reverse order)
  for (let i = middlewares.length - 1; i >= 0; i--) {
    const mw = middlewares[i];
    if (mw.after) {
      current = mw.after(current);
    }
  }
  return current;
}

// ─── Debug / Testing ───

export function getMiddlewares(): readonly Middleware[] {
  return middlewares;
}

export function clearMiddlewares(): void {
  middlewares.length = 0;
}
