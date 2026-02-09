/**
 * createStore — Kernel's single state tree
 *
 * Minimal reactive store. 0 dependencies.
 * Provides getState, setState, subscribe.
 */

export type Listener = () => void;

export interface Store<DB> {
    getState(): DB;
    setState(updater: (prev: DB) => DB): void;
    subscribe(listener: Listener): () => void;
}

export function createStore<DB>(initialState: DB): Store<DB> {
    let state = initialState;
    const listeners = new Set<Listener>();

    return {
        getState() {
            return state;
        },

        setState(updater) {
            state = updater(state);
            for (const listener of listeners) {
                listener();
            }
        },

        subscribe(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}
