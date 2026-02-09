import type {
  InternalCommandHandler,
  InternalEffectHandler,
  Middleware,
} from "./tokens.ts";

// ─── HMR-safe Registries (globalThis 기반) ───

const KEYS = {
  commands: "__kernel_commands__",
  interceptors: "__kernel_interceptors__",
  effects: "__kernel_effects__",
  middleware: "__kernel_middleware__",
} as const;

function getOrCreate<K, V>(key: string): Map<K, V> {
  const g = globalThis as Record<string, unknown>;
  if (!g[key]) g[key] = new Map<K, V>();
  return g[key] as Map<K, V>;
}

/** scopeId → commandType → handler */
export const scopedCommands: Map<
  string,
  Map<string, InternalCommandHandler>
> = getOrCreate(KEYS.commands);

/** scopeId → commandType → interceptors */
export const scopedInterceptors: Map<
  string,
  Map<string, Middleware[]>
> = getOrCreate(KEYS.interceptors);

/** scopeId → effectType → handler (scoped effects with bubbling) */
export const scopedEffects: Map<
  string,
  Map<string, InternalEffectHandler>
> = getOrCreate(KEYS.effects);

/** scopeId → middleware list */
export const scopedMiddleware: Map<string, Middleware[]> = getOrCreate(
  KEYS.middleware,
);

// ─── Debug / Testing ───

export function clearAllRegistries(): void {
  scopedCommands.clear();
  scopedInterceptors.clear();
  scopedEffects.clear();
  scopedMiddleware.clear();
}
