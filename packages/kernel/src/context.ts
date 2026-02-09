/**
 * context — Context providers & injection.
 *
 * defineContext(id, provider) — register a lazy context provider.
 * inject(...ids) — returns a Middleware (NOT auto-registered).
 *                  Pass it to defineCommand's interceptor list.
 *
 * Usage:
 *   defineContext("dom-items", () => queryDOMItems());
 *
 *   defineCommand("focus/move", (ctx) => {
 *     const items = ctx["dom-items"];  // injected by interceptor
 *   }, [inject("dom-items")]);         // <-- per-command, not global
 */

import type { Middleware, MiddlewareCtx } from "./middleware.ts";

// ─── Types ───

export type ContextProvider = () => unknown;

// ─── Registry ───

const contextProviders = new Map<string, ContextProvider>();

/**
 * defineContext — register a context provider.
 *
 * The provider is a function that returns a value.
 * It will be called lazily when the inject() interceptor runs.
 */
export function defineContext(id: string, provider: ContextProvider): void {
  contextProviders.set(id, provider);
}

/**
 * inject — create a per-command interceptor that resolves context providers.
 *
 * Returns a Middleware. Does NOT auto-register globally.
 * Pass to defineCommand/defineHandler as an interceptor:
 *   defineCommand("my-cmd", fn, [inject("dom-items")])
 */
export function inject(...ids: string[]): Middleware {
  const middlewareId = `inject:${ids.join(",")}`;

  return {
    id: middlewareId,
    before: (ctx: MiddlewareCtx): MiddlewareCtx => {
      const injected = { ...ctx.injected };

      for (const id of ids) {
        const provider = contextProviders.get(id);
        if (provider) {
          injected[id] = provider();
        } else {
          console.warn(`[kernel] No context provider registered for "${id}"`);
        }
      }

      return { ...ctx, injected };
    },
  };
}

// ─── Testing ───

export function clearContextProviders(): void {
  contextProviders.clear();
}
