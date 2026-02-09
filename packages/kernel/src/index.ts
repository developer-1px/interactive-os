/**
 * @kernel — Type-safe command dispatch with scoped bubbling.
 *
 * Core API:
 *   createKernel     → Group (root)
 *   Group.group()    → Group (child, with scope + inject)
 *   Group.defineCommand  → CommandFactory
 *   Group.defineEffect   → EffectToken
 *   Group.defineContext   → ContextToken
 *   Group.dispatch       → void
 *
 * Usage:
 *   const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => toast(msg));
 *   const kernel = createKernel({ effects: { NOTIFY } });
 *   const { defineCommand } = kernel.group({ scope: DIALOG, inject: [NOW] });
 *   const CMD = defineCommand("CMD", (ctx) => ({
 *     state: { ...ctx.state, count: ctx.state.count + 1 },
 *     [NOTIFY]: "hello",
 *   }));
 *   kernel.dispatch(CMD());
 */

// ── Context ──
export { clearContextProviders, defineContext } from "./context.ts";
// ── Store ──
export type { Store } from "./createStore.ts";
export { createStore } from "./createStore.ts";
// ── Registry & Kernel ──
export type { Middleware, MiddlewareContext, StateMarker } from "./registry.ts";
export {
  clearAllRegistries,
  createKernel,
  defineScope,
  dispatch,
  state,
} from "./registry.ts";
export {
  bindStore,
  getActiveStore,
  getState,
  resetState,
  unbindStore,
} from "./store.ts";
// ── Tokens ──
export type {
  Command,
  CommandFactory,
  ContextToken,
  EffectFields,
  EffectToken,
  InjectResult,
  ScopeToken,
  TypedContext,
  TypedEffectMap,
} from "./tokens.ts";
export { GLOBAL } from "./tokens.ts";

import { createStore as _createStore } from "./createStore.ts";
import { bindStore as _bindStore } from "./store.ts";

/** Convenience: create store + bind in one call. */
export function initKernel<S>(
  initialState: S,
): import("./createStore.ts").Store<S> {
  const store = _createStore(initialState);
  _bindStore(store);
  return store;
}

// ── React ──
export { useComputed } from "./react/useComputed.ts";
// ── Transaction / Inspector ──
export type { StateDiff, Transaction } from "./transaction.ts";
export {
  clearTransactions,
  getLastTransaction,
  getTransactions,
  recordTransaction,
  travelTo,
} from "./transaction.ts";

import { clearContextProviders as _clearCtx } from "./context.ts";
import { clearAllRegistries as _clearAll } from "./registry.ts";
import { clearTransactions as _clearTx } from "./transaction.ts";

// ── Testing ──
export function resetKernel(): void {
  _clearAll();
  _clearCtx();
  _clearTx();
}
