/**
 * @kernel — UI Application Kernel
 *
 * A minimal, 0-dependency command processing engine.
 * Inspired by re-frame's architecture: dispatch → pure handler → effects as data.
 *
 * Core API:
 *   createStore(initial)       — create the single state tree
 *   initKernel(initial)        — create store + bind in one call
 *   dispatch(cmd)              — single entry point for all commands
 *   defineHandler(id, fn, i?)  — register pure state transformer (optional interceptors)
 *   defineCommand(id, fn, i?)  — register command with effects (optional interceptors)
 *   defineEffect(id, fn)       — register side-effect executor
 *   use(middleware)             — register global middleware
 *   defineContext(id, fn)       — register context provider
 *   inject(...ids)              — create per-command injection interceptor
 *
 * React:
 *   useComputed(selector)      — subscribe to derived state
 *   useDispatch()              — get stable dispatch reference
 *
 * Inspector:
 *   getTransactions()          — full transaction log
 *   getLastTransaction()       — most recent transaction
 *   travelTo(id)               — time-travel to any transaction
 */

// ── Context ──
export { clearContextProviders, defineContext, inject } from "./context.ts";
export type { Store } from "./createStore.ts";
// ── Store ──
export { createStore } from "./createStore.ts";
export type { Transaction } from "./dispatch.ts";
// ── Dispatch ──
// ── Inspector ──
export {
  bindStore,
  clearTransactions,
  dispatch,
  getLastTransaction,
  getTransactions,
  travelTo,
} from "./dispatch.ts";
export type { Middleware, MiddlewareCtx } from "./middleware.ts";
// ── Middleware ──
export { clearMiddlewares, use } from "./middleware.ts";
// ── React ──
export { useComputed } from "./react/useComputed.ts";
export { useDispatch } from "./react/useDispatch.ts";
export type {
  Command,
  CommandFn,
  Context,
  EffectFn,
  EffectMap,
  HandlerFn,
} from "./registry.ts";
// ── Registry ──
// ── Testing utilities ──
export {
  clearAllRegistries,
  defineCommand,
  defineEffect,
  defineHandler,
} from "./registry.ts";

import { clearContextProviders } from "./context.ts";
// ── Convenience ──
import { createStore, type Store } from "./createStore.ts";
import { bindStore, clearTransactions } from "./dispatch.ts";
import { clearMiddlewares } from "./middleware.ts";
import { clearAllRegistries } from "./registry.ts";

export function initKernel<DB>(initialState: DB): Store<DB> {
  const store = createStore(initialState);
  bindStore(store);
  return store;
}

/**
 * resetKernel — clear everything: registries, middleware, context, transactions.
 * Use for testing or full teardown.
 */
export function resetKernel(): void {
  clearAllRegistries();
  clearMiddlewares();
  clearContextProviders();
  clearTransactions();
}
