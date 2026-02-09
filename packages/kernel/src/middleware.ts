/**
 * middleware — Global interceptor chain.
 *
 * Middlewares wrap the dispatch pipeline:
 *   before hooks → handler/command → after hooks (reverse order)
 *
 * Use cases:
 *   - Logging
 *   - Context injection (defineContext/inject will use this)
 *   - Transaction recording
 *   - Command aliasing/transformation
 *   - Effect modification
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
    /** Extensible — middlewares can attach arbitrary data */
    [key: string]: unknown;
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
 * runBeforeChain — execute all before hooks in order.
 */
export function runBeforeChain(ctx: MiddlewareCtx): MiddlewareCtx {
    let current = ctx;
    for (const mw of middlewares) {
        if (mw.before) {
            current = mw.before(current);
        }
    }
    return current;
}

/**
 * runAfterChain — execute all after hooks in reverse order.
 */
export function runAfterChain(ctx: MiddlewareCtx): MiddlewareCtx {
    let current = ctx;
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
