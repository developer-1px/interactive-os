import type {
  InternalCommandHandler,
  InternalEffectHandler,
  Middleware,
} from "./tokens.ts";

// ─── Registries ───

/** scopeId → commandType → handler */
export const scopedCommands = new Map<
  string,
  Map<string, InternalCommandHandler>
>();

/** scopeId → commandType → interceptors */
export const scopedInterceptors = new Map<string, Map<string, Middleware[]>>();

/** scopeId → effectType → handler (scoped effects with bubbling) */
export const scopedEffects = new Map<
  string,
  Map<string, InternalEffectHandler>
>();

/** scopeId → middleware list */
export const scopedMiddleware = new Map<string, Middleware[]>();

// ─── Debug / Testing ───

export function clearAllRegistries(): void {
  scopedCommands.clear();
  scopedInterceptors.clear();
  scopedEffects.clear();
  scopedMiddleware.clear();
}
