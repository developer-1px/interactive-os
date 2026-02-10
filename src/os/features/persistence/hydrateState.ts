import { logger } from "@/os-new/lib/logger";
import type { PersistenceAdapter } from "@/os-new/schema/state/PersistenceAdapter";
import { LocalStorageAdapter } from "@/os-new/schema/state/PersistenceAdapter";

export interface PersistenceConfig {
  key: string;
  adapter?: PersistenceAdapter;
  debounceMs?: number;
}

/**
 * Hydrates the initial state from persistence.
 * Merges loaded state with initial state structure to ensure schema compatibility.
 */
export function hydrateState<S>(
  initialState: S,
  config?: PersistenceConfig,
): S {
  if (!config) return initialState;

  const { key, adapter = LocalStorageAdapter } = config;
  const loaded = adapter.load(key);

  if (loaded && typeof loaded === "object" && !Array.isArray(loaded)) {
    logger.debug("ENGINE", `Hydrated from [${key}]`);
    return {
      ...initialState,
      ...loaded,
      // Deep merge data/ui if they exist (schema evolution safety)
      data:
        (initialState as any).data && (loaded as any).data
          ? { ...(initialState as any).data, ...(loaded as any).data }
          : (loaded as any).data || (initialState as any).data,
      ui:
        (initialState as any).ui && (loaded as any).ui
          ? { ...(initialState as any).ui, ...(loaded as any).ui }
          : (loaded as any).ui || (initialState as any).ui,
    };
  }

  return initialState;
}

/**
 * Creates a debounced persister function.
 * Call this after state updates.
 */
export function createPersister<S>(config?: PersistenceConfig) {
  if (!config) return () => {};

  const { key, adapter = LocalStorageAdapter, debounceMs = 300 } = config;
  let saveTimeout: any;

  return (state: S) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      adapter.save(key, state);
    }, debounceMs);
  };
}
