import { clearContextProviders } from "./core/context.ts";
import { createStore, type Store, unbindStore } from "./core/createStore.ts";
import { createGroup } from "./core/group.ts";
import { clearAllRegistries } from "./core/registries.ts";
import {
  type EffectToken,
  GLOBAL,
  type ScopeToken,
  type StateMarker,
} from "./core/tokens.ts";
import { clearTransactions } from "./core/transaction.ts";

/**
 * Create a Kernel instance — returns the root Group.
 *
 * The kernel is itself a Group at GLOBAL scope with no inject.
 *
 * @example
 *   const kernel = createKernel({ state: state<AppState>(), effects: { NOTIFY } });
 *   const CMD = kernel.defineCommand("CMD", (ctx) => ({
 *     state: { ...ctx.state, count: ctx.state.count + 1 },
 *     [NOTIFY]: "hello",
 *   }));
 */
export function createKernel<
  E extends Record<string, EffectToken> = Record<string, never>,
  S = unknown,
>(_config: { state?: StateMarker<S>; effects?: E }) {
  return createGroup<S, E, []>(GLOBAL as string, []);
}

/**
 * Create a ScopeToken. No tree management — Kernel doesn't know about DOM.
 *
 * @example
 *   const CARD_LIST = defineScope("CARD_LIST");
 */
export function defineScope<Id extends string>(id: Id): ScopeToken<Id> {
  return id as ScopeToken<Id>;
}

/** Create a phantom state type marker. No runtime cost. */
export function state<S>(): StateMarker<S> {
  return {} as StateMarker<S>;
}

/** Convenience: create store + bind in one call. */
export function initKernel<S>(initialState: S): Store<S> {
  const store = createStore(initialState);
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
  unbindStore();
}
