/**
 * middleware — Global interceptor chain.
 *
 * Middlewares wrap the dispatch pipeline:
 *   before hooks → handler/command → after hooks (reverse order)
 *
 * Two levels:
 *   - Global: registered via use(), runs on every dispatch.
 *   - Per-command: passed to defineCommand, runs only for that command.
 *
 * Execution order:
 *   global-A:before → global-B:before → per-cmd-X:before → handler → per-cmd-X:after → global-B:after → global-A:after
 */

import type { Command, EffectMap } from "./registry.ts";

// ─── Types ───

export type MiddlewareContext = {
  /** The command being dispatched */
  command: Command;
  /** Current state (before handler) */
  state: unknown;
  /** Handler type that was matched */
  handlerType: "handler" | "command" | "unknown";
  /** Effects returned by command (null if command not found) */
  effects: EffectMap | null;
  /** Injected context values (populated by inject() middleware) */
  injected: Record<string, unknown>;
};

export type Middleware = {
  id: string;
  /** Runs before handler execution. Can modify command or inject context. */
  before?: (ctx: MiddlewareContext) => MiddlewareContext;
  /** Runs after handler execution (reverse order). Can modify effects. */
  after?: (ctx: MiddlewareContext) => MiddlewareContext;
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
  ctx: MiddlewareContext,
  perCommand?: Middleware[],
): MiddlewareContext {
  let current = ctx;
  // Global middlewares first
  for (const entry of middlewares) {
    if (entry.before) {
      current = entry.before(current);
    }
  }
  // Per-command interceptors second (closer to handler)
  if (perCommand) {
    for (const entry of perCommand) {
      if (entry.before) {
        current = entry.before(current);
      }
    }
  }
  return current;
}

export function runAfterChain(
  ctx: MiddlewareContext,
  perCommand?: Middleware[],
): MiddlewareContext {
  let current = ctx;
  // Per-command interceptors first (reverse order, unwinding)
  if (perCommand) {
    for (let i = perCommand.length - 1; i >= 0; i--) {
      const entry = perCommand[i];
      if (entry.after) {
        current = entry.after(current);
      }
    }
  }
  // Global middlewares second (reverse order)
  for (let i = middlewares.length - 1; i >= 0; i--) {
    const entry = middlewares[i];
    if (entry.after) {
      current = entry.after(current);
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
