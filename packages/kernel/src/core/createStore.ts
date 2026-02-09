/**
 * createStore — Kernel's single state tree
 *
 * Minimal reactive store. 0 dependencies.
 * Provides getState, setState, subscribe.
 */

export type Listener = () => void;

export interface Store<S> {
  getState(): S;
  setState(updater: (prev: S) => S): void;
  subscribe(listener: Listener): () => void;
}

let activeStore: Store<unknown> | null = null;

export function createStore<S>(initialState: S): Store<S> {
  let state = initialState;
  const listeners = new Set<Listener>();

  const store = {
    getState() {
      return state;
    },

    setState(updater: (prev: S) => S) {
      state = updater(state);
      for (const listener of listeners) {
        listener();
      }
    },

    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  activeStore = store as Store<unknown>;
  return store;
}

// ─── Store Binding (merged from store.ts) ───

export function getActiveStore(): Store<unknown> | null {
  return activeStore;
}

/**
 * getState — read the current state tree.
 *
 * Use in defineContext providers or outside React components.
 * Inside React, prefer useComputed(selector) instead.
 */
export function getState<S = unknown>(): S {
  if (!activeStore) {
    throw new Error("[kernel] No store bound. Call initKernel() first.");
  }
  return activeStore.getState() as S;
}

/**
 * resetState — replace the entire state tree.
 *
 * Use for testing or full state reset. Triggers all subscribers.
 */
export function resetState<S>(nextState: S): void {
  if (!activeStore) {
    throw new Error("[kernel] No store bound. Call initKernel() first.");
  }
  activeStore.setState(() => nextState as unknown);
}

/**
 * unbindStore — disconnect dispatch from the store.
 * Used for full teardown (testing only).
 */
export function unbindStore(): void {
  activeStore = null;
}
