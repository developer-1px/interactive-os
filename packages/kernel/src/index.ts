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
 *   defineCommand(id, fn, i?)  — register command (optional interceptors)
 *   defineEffect(id, fn)       — register side-effect executor
 *   use(middleware)             — register global middleware
 *   defineContext(id, fn)       — register context provider
 *   inject(...ids)              — create per-command injection interceptor
 *
 * Store:
 *   getState()                 — read current state tree
 *   resetState(state)          — replace entire state tree
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

// ── Store ──
export type { Store } from "./createStore.ts";
export { createStore } from "./createStore.ts";
// ── Dispatch ──
export { dispatch } from "./dispatch.ts";
// ── Middleware ──
export type { Middleware, MiddlewareContext } from "./middleware.ts";
export { clearMiddlewares, use } from "./middleware.ts";
// ── React ──
export { useComputed } from "./react/useComputed.ts";
export { useDispatch } from "./react/useDispatch.ts";
// ── Registry ──
export type {
  Command,
  CommandHandler,
  Context,
  EffectHandler,
  EffectMap,
} from "./registry.ts";
export {
  clearAllRegistries,
  defineCommand,
  defineEffect,
} from "./registry.ts";
export {
  bindStore,
  getState,
  resetState,
  unbindStore,
} from "./store.ts";
// ── Transaction / Inspector ──
export type { StateDiff, Transaction } from "./transaction.ts";
export {
  clearTransactions,
  getLastTransaction,
  getTransactions,
  travelTo,
} from "./transaction.ts";

// ── Convenience ──
import { clearContextProviders } from "./context.ts";
import { createStore, type Store } from "./createStore.ts";
import { clearMiddlewares } from "./middleware.ts";
import { clearAllRegistries } from "./registry.ts";
import { bindStore, getActiveStore, resetState } from "./store.ts";
import { clearTransactions } from "./transaction.ts";

export function initKernel<S>(initialState: S): Store<S> {
  const existing = getActiveStore();
  if (existing) {
    resetState(initialState);
    return existing as Store<S>;
  }
  const store = createStore(initialState);
  bindStore(store);
  return store;
}

/**
 * resetKernel — clear registries, middleware, context, transactions.
 * Store binding is preserved so React subscriptions (useComputed) stay valid.
 * Use unbindStore() separately for full teardown.
 */
export function resetKernel(): void {
  clearAllRegistries();
  clearMiddlewares();
  clearContextProviders();
  clearTransactions();
}
