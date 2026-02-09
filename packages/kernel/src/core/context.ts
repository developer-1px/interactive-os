/**
 * context — Context providers.
 *
 * defineContext(id, provider) — register a lazy context provider. Returns ContextToken.
 *
 * @example
 *   const NOW = defineContext("NOW", () => Date.now());
 *
 *   // Use via group inject:
 *   const { defineCommand } = kernel.group({ inject: [NOW] });
 *   defineCommand("USE_TIME", (ctx) => {
 *     ctx.NOW;  // auto-typed as number
 *   });
 */

import type { ContextToken } from "./tokens.ts";

// ─── HMR-safe Registry (globalThis 기반) ───

const CTX_KEY = "__kernel_context_providers__";

function getProviders(): Map<string, () => unknown> {
  const g = globalThis as Record<string, unknown>;
  if (!g[CTX_KEY]) g[CTX_KEY] = new Map<string, () => unknown>();
  return g[CTX_KEY] as Map<string, () => unknown>;
}

const contextProviders = getProviders();

/**
 * defineContext — register a context provider. Returns a ContextToken.
 *
 * The provider is called lazily when the group's inject middleware runs.
 */
export function defineContext<Id extends string, V>(
  id: Id,
  provider: () => V,
): ContextToken<Id, V> {
  contextProviders.set(id, provider);
  return { __id: id } as ContextToken<Id, V>;
}

/**
 * resolveContext — resolve a context provider by ID. Used by group inject.
 */
export function resolveContext(id: string): unknown {
  const provider = contextProviders.get(id);
  if (provider) {
    return provider();
  }
  console.warn(`[kernel] No context provider registered for "${id}"`);
  return undefined;
}

// ─── Testing ───

export function clearContextProviders(): void {
  contextProviders.clear();
}
