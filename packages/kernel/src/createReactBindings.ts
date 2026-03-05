import { useCallback, useRef, useSyncExternalStore } from "react";
import { shallow } from "./core/shallow.ts";
import type { QueryToken } from "./core/tokens.ts";

export interface ReactBindingKernel<S> {
  getState: () => S;
  subscribe: (listener: () => void) => () => void;
  resolveQuery: <T>(id: string) => T;
}

export function createReactBindings<S>(kernel: ReactBindingKernel<S>) {
  const { getState, subscribe, resolveQuery } = kernel;

  function useComputed<T>(selector: (state: S) => T): T {
    // We stabilize the selector result using a dual-layer cache strategy.
    // 1. Input Stability: If state & selector haven't changed, return cached result.
    // 2. Output Stability: If calculated result is shallow-equal to cached result, return cached result.

    const selectorRef = useRef(selector);
    // Update ref during render so getSnapshot always has fresh closure
    selectorRef.current = selector;

    const cacheRef = useRef<{
      state: S;
      selection: T;
      selectorInput: (state: S) => T; // To invalid cache on selector change
    } | null>(null);

    const getSnapshot = useCallback(() => {
      const currentState = getState();
      const currentSelector = selectorRef.current;

      // Layer 1: Input Memoization (Optimistic)
      if (
        cacheRef.current &&
        cacheRef.current.state === currentState &&
        cacheRef.current.selectorInput === currentSelector
      ) {
        return cacheRef.current.selection;
      }

      // Re-calculate
      const nextSelection = currentSelector(currentState);

      // Layer 2: Output Memoization (Integrity)
      if (
        cacheRef.current &&
        shallow(cacheRef.current.selection, nextSelection)
      ) {
        // Update input cache but keep old output reference
        cacheRef.current.state = currentState;
        cacheRef.current.selectorInput = currentSelector;
        return cacheRef.current.selection;
      }

      // Update full cache
      cacheRef.current = {
        state: currentState,
        selection: nextSelection,
        selectorInput: currentSelector,
      };

      return nextSelection;
    }, [getState]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  function useQuery<T>(token: QueryToken<string, T>): T {
    const tokenRef = useRef(token);
    tokenRef.current = token;

    const cacheRef = useRef<{
      state: S;
      value: T;
    } | null>(null);

    const getSnapshot = useCallback(() => {
      const currentState = getState();
      const id = tokenRef.current.__id;

      // Resolve through the query cache (handles invalidateOn internally)
      const nextValue = resolveQuery<T>(id);

      // Output stability: shallow compare to prevent unnecessary re-renders
      if (cacheRef.current && shallow(cacheRef.current.value, nextValue)) {
        cacheRef.current.state = currentState;
        return cacheRef.current.value;
      }

      cacheRef.current = {
        state: currentState,
        value: nextValue,
      };

      return nextValue;
    }, [getState, resolveQuery]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  return {
    useComputed,
    useQuery,
  };
}
