/**
 * useComputed — React hook to subscribe to derived state.
 *
 * Uses useSyncExternalStore for tear-free reads in concurrent mode.
 * The selector function determines when to re-render (via Object.is comparison).
 *
 * Memoizes getSnapshot to prevent unnecessary re-subscriptions
 * when the selector reference changes across renders.
 */

import { useCallback, useRef, useSyncExternalStore } from "react";
import { getActiveStore } from "../core/createStore.ts";

export function useComputed<T>(selector: (state: unknown) => T): T {
  const store = getActiveStore();
  if (!store) {
    throw new Error("[kernel] useComputed called before initKernel()");
  }

  // Keep selector in ref so getSnapshot identity stays stable
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const getSnapshot = useCallback(
    () => selectorRef.current(store.getState()),
    [store],
  );

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
