/**
 * store — Kernel ↔ Store binding layer.
 *
 * Connects the kernel's dispatch pipeline to a Zustand-compatible store.
 * Single binding point: one store per kernel instance.
 */

import type { Store } from "./createStore.ts";

// ─── Core ───

let activeStore: Store<unknown> | null = null;

/**
 * bindStore — connect the dispatch pipeline to a store.
 * Must be called once before any dispatch.
 */
export function bindStore<S>(store: Store<S>): void {
  activeStore = store as Store<unknown>;
}

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
