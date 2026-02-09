/**
 * @kernel — UI Application Kernel
 *
 * A minimal, 0-dependency command processing engine.
 * Inspired by re-frame's architecture: dispatch → pure handler → effects as data.
 *
 * Core API:
 *   createStore(initial)       — create the single state tree
 *   initKernel(initial)        — create store + bind in one call
 *   dispatch(cmd)              — single entry point for all commands
 *   defineHandler(id, fn)      — register pure state transformer
 *   defineCommand(id, fn)      — register command with effects
 *   defineEffect(id, fn)       — register side-effect executor
 *   use(middleware)             — register global middleware
 *
 * React:
 *   useComputed(selector)      — subscribe to derived state
 *   useDispatch()              — get stable dispatch reference
 *
 * Inspector:
 *   getTransactions()          — full transaction log
 *   getLastTransaction()       — most recent transaction
 *   travelTo(id)               — time-travel to any transaction
 */

// ── Store ──
export { createStore } from "./createStore.ts";
export type { Store } from "./createStore.ts";

// ── Registry ──
export { defineHandler, defineCommand, defineEffect } from "./registry.ts";
export type {
    Command,
    EffectMap,
    HandlerFn,
    CommandFn,
    EffectFn,
    Context,
} from "./registry.ts";

// ── Middleware ──
export { use } from "./middleware.ts";
export type { Middleware, MiddlewareCtx } from "./middleware.ts";

// ── Dispatch ──
export { dispatch, bindStore } from "./dispatch.ts";
export type { Transaction } from "./dispatch.ts";

// ── React ──
export { useComputed } from "./react/useComputed.ts";
export { useDispatch } from "./react/useDispatch.ts";

// ── Inspector ──
export {
    getTransactions,
    getLastTransaction,
    travelTo,
    clearTransactions,
} from "./dispatch.ts";

// ── Testing utilities ──
export { clearAllRegistries } from "./registry.ts";
export { clearMiddlewares } from "./middleware.ts";

// ── Convenience: create + bind in one call ──
import { createStore, type Store } from "./createStore.ts";
import { bindStore } from "./dispatch.ts";

export function initKernel<DB>(initialState: DB): Store<DB> {
    const store = createStore(initialState);
    bindStore(store);
    return store;
}
