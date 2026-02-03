/**
 * Generic Persistence Adapter for Antigravity OS
 */

export interface PersistenceAdapter {
    load(key: string): any | null;
    save(key: string, data: any): void;
    remove(key: string): void;
}

export const LocalStorageAdapter: PersistenceAdapter = {
    load: (key: string) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn(`[OS] Failed to load key: ${key}`, e);
            return null;
        }
    },
    save: (key: string, data: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn(`[OS] Failed to save key: ${key}`, e);
        }
    },
    remove: (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`[OS] Failed to remove key: ${key}`, e);
        }
    },
};

export function createPersistentStore<S>(
    key: string,
    initialState: S,
    adapter: PersistenceAdapter = LocalStorageAdapter
): S {
    const loaded = adapter.load(key);
    // Shallow merge or deep merge could be configured, for now simple override or initial
    return loaded ? { ...initialState, ...loaded } : initialState;
}
