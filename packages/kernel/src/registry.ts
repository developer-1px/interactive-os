/**
 * registry — defineHandler, defineCommand, defineEffect
 *
 * Three registries that map command types to their processors.
 * All registration happens at startup. Lookup happens at dispatch time.
 *
 * Both defineHandler and defineCommand accept optional per-command
 * interceptors (Middleware[]) that run only for that specific command.
 */

import type { Middleware } from "./middleware.ts";

// ─── Types ───

export type Command = {
  type: string;
  payload?: unknown;
};

export type EffectMap = {
  db?: unknown;
  dispatch?: Command | Command[];
  [key: string]: unknown;
};

/** Pure state transformer: (db, payload) → nextDb */
export type HandlerFn<DB = unknown> = (db: DB, payload: unknown) => DB;

/** Pure command with effects: (ctx, payload) → EffectMap */
export type CommandFn<DB = unknown> = (
  ctx: Context<DB>,
  payload: unknown,
) => EffectMap;

/** Side-effect executor: (value) → void */
export type EffectFn = (value: unknown) => void;

/** Read-only context passed to commands */
export type Context<DB = unknown> = {
  db: DB;
  [key: string]: unknown;
};

// ─── Registries ───

const handlers = new Map<string, HandlerFn>();
const commands = new Map<string, CommandFn>();
const effects = new Map<string, EffectFn>();
const interceptorMap = new Map<string, Middleware[]>();

// ─── Registration API ───

/**
 * defineHandler — register a pure state transformer.
 *
 * (db, payload) → db. No side effects. No context injection.
 * Optionally accepts per-command interceptors.
 */
export function defineHandler<DB = unknown>(
  id: string,
  handler: HandlerFn<DB>,
  interceptors?: Middleware[],
): void {
  if (handlers.has(id) || commands.has(id)) {
    console.warn(`[kernel] handler "${id}" is being overwritten`);
  }
  handlers.set(id, handler as HandlerFn);
  if (interceptors?.length) {
    interceptorMap.set(id, interceptors);
  }
}

/**
 * defineCommand — register a command that returns effects.
 *
 * (ctx, payload) → EffectMap. Pure function. No direct side effects.
 * Optionally accepts per-command interceptors (e.g. inject()).
 *
 * @example
 *   defineCommand("focus/move", (ctx) => {
 *     const items = ctx["dom-items"];
 *     return { db: nextState };
 *   }, [inject("dom-items")]);
 */
export function defineCommand<DB = unknown>(
  id: string,
  command: CommandFn<DB>,
  interceptors?: Middleware[],
): void {
  if (handlers.has(id) || commands.has(id)) {
    console.warn(`[kernel] command "${id}" is being overwritten`);
  }
  commands.set(id, command as CommandFn);
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
export function defineEffect(id: string, effect: EffectFn): void {
  if (effects.has(id)) {
    console.warn(`[kernel] effect "${id}" is being overwritten`);
  }
  effects.set(id, effect);
}

// ─── Internal lookups (used by dispatch) ───

export function getHandler(id: string): HandlerFn | undefined {
  return handlers.get(id);
}

export function getCommand(id: string): CommandFn | undefined {
  return commands.get(id);
}

export function getEffect(id: string): EffectFn | undefined {
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
  handlers.clear();
  commands.clear();
  effects.clear();
  interceptorMap.clear();
}
