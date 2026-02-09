/**
 * context — Context providers & injection.
 *
 * defineContext(id, provider) — register a lazy context provider.
 * inject(id) — returns a Middleware that resolves the provider
 *              and attaches the result to the MiddlewareCtx.
 *
 * Usage:
 *   defineContext("dom-items", () => queryDOMItems());
 *
 *   defineCommand("focus/move", (ctx) => {
 *     const items = ctx["dom-items"];  // injected by middleware
 *     // ...
 *   });
 *
 *   // Register injection for a specific handler:
 *   inject("dom-items");  // returns Middleware, auto-registered via use()
 */

import type { Middleware, MiddlewareCtx } from "./middleware.ts";
import { use } from "./middleware.ts";

// ─── Types ───

export type ContextProvider = () => unknown;

// ─── Registry ───

const contextProviders = new Map<string, ContextProvider>();

/**
 * defineContext — register a context provider.
 *
 * The provider is a function that returns a value.
 * It will be called lazily when inject() middleware runs.
 */
export function defineContext(id: string, provider: ContextProvider): void {
    contextProviders.set(id, provider);
}

/**
 * getContextProvider — internal lookup.
 */
export function getContextProvider(id: string): ContextProvider | undefined {
    return contextProviders.get(id);
}

/**
 * inject — create and auto-register a middleware that resolves
 * a context provider and attaches its result to the MiddlewareCtx.
 *
 * The injected value is accessible in command handlers via `ctx[id]`.
 */
export function inject(...ids: string[]): Middleware {
    const middlewareId = `inject:${ids.join(",")}`;

    const mw: Middleware = {
        id: middlewareId,
        before: (ctx: MiddlewareCtx): MiddlewareCtx => {
            const injected: Record<string, unknown> = {};

            for (const id of ids) {
                const provider = contextProviders.get(id);
                if (provider) {
                    injected[id] = provider();
                } else {
                    console.warn(`[kernel] No context provider registered for "${id}"`);
                }
            }

            return { ...ctx, ...injected };
        },
    };

    // Auto-register via use()
    use(mw);

    return mw;
}

// ─── Testing ───

export function clearContextProviders(): void {
    contextProviders.clear();
}
