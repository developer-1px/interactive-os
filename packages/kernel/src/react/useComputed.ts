/**
 * useComputed — React hook to subscribe to derived state.
 *
 * Uses useSyncExternalStore for tear-free reads in concurrent mode.
 * The selector function determines when to re-render (via Object.is comparison).
 */

import { useSyncExternalStore } from "react";
import { getActiveStore } from "../dispatch.ts";

export function useComputed<T>(selector: (db: unknown) => T): T {
    const store = getActiveStore();
    if (!store) {
        throw new Error("[kernel] useComputed called before initKernel()");
    }

    return useSyncExternalStore(
        store.subscribe,
        () => selector(store.getState()),
        () => selector(store.getState()),
    );
}
