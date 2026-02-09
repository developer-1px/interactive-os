/**
 * dispatch — Kernel's single entry point for all commands.
 *
 * Command → Queue → Process:
 *   1. Build middleware context
 *   2. Run before chain (global + per-command)
 *   3. Execute handler/command
 *   4. Run after chain (per-command + global, reverse)
 *   5. Execute effects
 *   6. Record transaction
 *
 * Re-entrance safe via queue.
 */

import type { MiddlewareContext } from "./middleware.ts";
import { runAfterChain, runBeforeChain } from "./middleware.ts";
import type { Command, Context, EffectMap } from "./registry.ts";
import { getCommand, getEffect, getInterceptors } from "./registry.ts";
import { getActiveStore } from "./store.ts";
import { recordTransaction } from "./transaction.ts";

// ─── Command Queue (re-entrance safe) ───

const queue: Command[] = [];
let processing = false;

/**
 * dispatch — the single entry point.
 */
export function dispatch(cmd: Command): void {
  queue.push(cmd);

  if (processing) return; // queue will be drained by outer loop

  processing = true;
  while (queue.length > 0) {
    const next = queue.shift()!;
    processCommand(next);
  }
  processing = false;
}

function processCommand(cmd: Command): void {
  const store = getActiveStore();
  if (!store) {
    throw new Error("[kernel] No store bound. Call initKernel() first.");
  }

  const stateBefore = store.getState();

  // 1. Build middleware context
  let middlewareCtx: MiddlewareContext = {
    command: cmd,
    state: stateBefore,
    handlerType: "unknown",
    effects: null,
    injected: {},
  };

  // 2. Get per-command interceptors
  const { type, payload } = cmd;
  const perCommand = getInterceptors(type);

  // 3. Run before chain (global + per-command)
  middlewareCtx = runBeforeChain(middlewareCtx, perCommand);

  // 4. Resolve and execute command (using possibly-transformed command)
  const resolvedType = middlewareCtx.command.type;
  const resolvedPayload = middlewareCtx.command.payload ?? payload;
  const command = getCommand(resolvedType);

  if (command) {
    // ── defineCommand path: (ctx, payload) → EffectMap ──
    middlewareCtx.handlerType = "command";
    const ctx: Context = {
      state: middlewareCtx.state,
      ...middlewareCtx.injected,
    };
    middlewareCtx.effects = command(ctx, resolvedPayload);
  } else {
    console.warn(`[kernel] No command registered for "${resolvedType}"`);
  }

  // 5. Run after chain (per-command + global, reverse order)
  middlewareCtx = runAfterChain(middlewareCtx, perCommand);

  // 6. Execute effects (after middleware may have modified them)
  if (middlewareCtx.effects) {
    executeEffects(middlewareCtx.effects, store);
  }

  const stateAfter = store.getState();

  // 7. Record transaction
  recordTransaction(
    middlewareCtx.command,
    middlewareCtx.handlerType,
    middlewareCtx.effects,
    stateBefore,
    stateAfter,
  );
}

function executeEffects(
  effectMap: EffectMap,
  store: { setState: (fn: (s: unknown) => unknown) => void },
): void {
  for (const [key, value] of Object.entries(effectMap)) {
    if (value === undefined) continue;

    if (key === "state") {
      // Built-in: state update
      store.setState(() => value);
      continue;
    }

    if (key === "dispatch") {
      // Built-in: re-dispatch (goes to queue, processed after current command)
      const cmds = Array.isArray(value) ? value : [value];
      for (const c of cmds as Command[]) {
        dispatch(c);
      }
      continue;
    }

    // Custom effects — look up registry
    const effectFn = getEffect(key);
    if (effectFn) {
      effectFn(value);
    } else {
      console.warn(`[kernel] Unknown effect "${key}" in EffectMap`);
    }
  }
}
