/**
 * store — Kernel ↔ Store binding layer and init helper.
 */
export type { Store } from "./core/createStore.ts";
export { createStore } from "./core/createStore.ts";
export {
  bindStore,
  getActiveStore,
  getState,
  resetState,
  unbindStore,
} from "./core/store.ts";

import { clearContextProviders } from "./core/context.ts";
import { createStore as _createStore } from "./core/createStore.ts";
import { clearAllRegistries } from "./core/registries.ts";
import { bindStore as _bindStore } from "./core/store.ts";
import { clearTransactions } from "./core/transaction.ts";

/** Convenience: create store + bind in one call. */
export function initKernel<S>(
  initialState: S,
): import("./core/createStore.ts").Store<S> {
  const store = _createStore(initialState);
  _bindStore(store);
  return store;
}

/**
 * resetKernel — Clear all registries, contexts, transactions, and unbind store.
 * Used for testing.
 */
export function resetKernel(): void {
  clearAllRegistries();
  clearContextProviders();
  clearTransactions();
  // unbindStore(); // Optional, but clearAllRegistries clears commands/effects.
}
