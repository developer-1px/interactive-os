// Inspector Persistence Hook
// OS-level persistence for Inspector open state, independent of App state

import { useEffect, useLayoutEffect } from "react";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";

const STORAGE_KEY = "antigravity_inspector_open";

interface InspectorStore {
    getState: () => any;
    setState: (fn: (prev: any) => any) => void;
    subscribe: (fn: () => void) => () => void;
}

/**
 * Syncs Inspector open state between App state and localStorage.
 * This is an OS-level concern, not an App concern.
 */
export function useInspectorPersistence(store: InspectorStore) {
    const [persistedOpen, setPersistedOpen] = useLocalStorage(STORAGE_KEY, true);

    // Hydrate: localStorage → store (on mount)
    useLayoutEffect(() => {
        const current = store.getState()?.state?.ui?.isInspectorOpen;
        if (current !== persistedOpen) {
            store.setState((prev: any) => ({
                ...prev,
                state: {
                    ...prev.state,
                    ui: {
                        ...prev.state?.ui,
                        isInspectorOpen: persistedOpen
                    }
                }
            }));
        }
    }, []); // Run ONCE on mount

    // Sync: store → localStorage (on change)
    useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            const isOpen = store.getState()?.state?.ui?.isInspectorOpen;
            if (isOpen !== undefined && isOpen !== persistedOpen) {
                setPersistedOpen(isOpen);
            }
        });
        return unsubscribe;
    }, [store, persistedOpen, setPersistedOpen]);
}
