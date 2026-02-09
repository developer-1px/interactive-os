/**
 * registry — defineCommand, defineEffect
 *
 * Two registries that map command types to their processors.
 * All registration happens at startup. Lookup happens at dispatch time.
 *
 * defineCommand accepts optional per-command interceptors (Middleware[])
 * that run only for that specific command.
 */

import type { Middleware } from "./middleware.ts";

// ─── Types ───

export type Command = {
  type: string;
  payload?: unknown;
};

export type EffectMap = {
  state?: unknown;
  dispatch?: Command | Command[];
  [key: string]: unknown;
};

/** Pure command with effects: (ctx, payload) → EffectMap */
export type CommandHandler<S = unknown> = (
  ctx: Context<S>,
  payload: unknown,
) => EffectMap;

/** Side-effect executor: (value) → void */
export type EffectHandler = (value: unknown) => void;

/** Read-only context passed to commands */
export type Context<S = unknown> = {
  state: S;
  [key: string]: unknown;
};

// ─── Registries ───

const commands = new Map<string, CommandHandler>();
const effects = new Map<string, EffectHandler>();
const interceptorMap = new Map<string, Middleware[]>();

// ─── Registration API ───

/**
 * defineCommand — register a command that returns effects.
 *
 * (ctx, payload) → EffectMap. Pure function. No direct side effects.
 * Optionally accepts per-command interceptors (e.g. inject()).
 *
 * @example
 *   defineCommand("focus/move", (ctx) => {
 *     const items = ctx["dom-items"];
 *     return { state: nextState };
 *   }, [inject("dom-items")]);
 */
export function defineCommand<S = unknown>(
  id: string,
  command: CommandHandler<S>,
  interceptors?: Middleware[],
): void {
  if (commands.has(id)) {
    console.warn(`[kernel] command "${id}" is being overwritten`);
  }
  commands.set(id, command as CommandHandler);
  if (interceptors?.length) {
    interceptorMap.set(id, interceptors);
  }
}

/**
 * defineEffect — register a side-effect executor.
 *
 * Called by the kernel after a command handler returns an EffectMap.
 * Each key in the EffectMap is looked up in this registry.
 */
export function defineEffect(id: string, effect: EffectHandler): void {
  if (effects.has(id)) {
    console.warn(`[kernel] effect "${id}" is being overwritten`);
  }
  effects.set(id, effect);
}

// ─── Internal lookups (used by dispatch) ───

export function getCommand(id: string): CommandHandler | undefined {
  return commands.get(id);
}

export function getEffect(id: string): EffectHandler | undefined {
  return effects.get(id);
}

export function getInterceptors(id: string): Middleware[] | undefined {
  return interceptorMap.get(id);
}

export function getAllEffectKeys(): string[] {
  return Array.from(effects.keys());
}

// ─── Debug / Testing ───

export function clearAllRegistries(): void {
  commands.clear();
  effects.clear();
  interceptorMap.clear();
}
