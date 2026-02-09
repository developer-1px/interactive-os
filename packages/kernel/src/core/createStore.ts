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

// HMR-safe: globalThis에 저장하여 모듈 재실행에도 유지
const STORE_KEY = "__kernel_store__";

function getStoreSingleton(): Store<unknown> | null {
  return (
    ((globalThis as Record<string, unknown>)[
      STORE_KEY
    ] as Store<unknown> | null) ?? null
  );
}

function setStoreSingleton(store: Store<unknown> | null): void {
  (globalThis as Record<string, unknown>)[STORE_KEY] = store;
}

export function createStore<S>(initialState: S): Store<S> {
  // HMR-safe: 이미 Store가 존재하면 재생성하지 않음 (상태 보존)
  const existing = getStoreSingleton();
  if (existing) {
    return existing as Store<S>;
  }

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

  setStoreSingleton(store as Store<unknown>);
  return store;
}

// ─── Store Binding (merged from store.ts) ───

export function getActiveStore(): Store<unknown> | null {
  return getStoreSingleton();
}

/**
 * getState — read the current state tree.
 *
 * Use in defineContext providers or outside React components.
 * Inside React, prefer useComputed(selector) instead.
 */
export function getState<S = unknown>(): S {
  const store = getStoreSingleton();
  if (!store) {
    throw new Error("[kernel] No store bound. Call initKernel() first.");
  }
  return store.getState() as S;
}

/**
 * resetState — replace the entire state tree.
 *
 * Use for testing or full state reset. Triggers all subscribers.
 */
export function resetState<S>(nextState: S): void {
  const store = getStoreSingleton();
  if (!store) {
    throw new Error("[kernel] No store bound. Call initKernel() first.");
  }
  store.setState(() => nextState as unknown);
}

/**
 * unbindStore — disconnect dispatch from the store.
 * Used for full teardown (testing only).
 */
export function unbindStore(): void {
  setStoreSingleton(null);
}
