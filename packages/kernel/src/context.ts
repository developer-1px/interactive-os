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

// ─── Registry ───

const contextProviders = new Map<string, () => unknown>();

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
