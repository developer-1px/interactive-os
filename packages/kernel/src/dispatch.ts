/**
 * dispatch — Kernel's single entry point for all commands.
 *
 * Command → Queue → Process:
 *   1. Look up handler or command
 *   2. Execute (pure function)
 *   3. Run effects
 *   4. Record transaction (always)
 *
 * Re-entrance safe via queue.
 */

import type { Store } from "./createStore.ts";
import type { Command, EffectMap, Context } from "./registry.ts";
import { getHandler, getCommand, getEffect } from "./registry.ts";
import type { MiddlewareCtx } from "./middleware.ts";
import { runBeforeChain, runAfterChain } from "./middleware.ts";

// ─── Transaction Log ───

export type Transaction = {
    id: number;
    timestamp: number;
    command: Command;
    handlerType: "handler" | "command" | "unknown";
    effects: EffectMap | null;
    changes: unknown;
    dbBefore: unknown;
    dbAfter: unknown;
};

const transactions: Transaction[] = [];
let nextTransactionId = 0;

// ─── Command Queue (re-entrance safe) ───

let queue: Command[] = [];
let processing = false;

// ─── Core ───

let activeStore: Store<unknown> | null = null;

/**
 * bindStore — connect the dispatch pipeline to a store.
 * Must be called once before any dispatch.
 */
export function bindStore<DB>(store: Store<DB>): void {
    activeStore = store as Store<unknown>;
}

export function getActiveStore(): Store<unknown> | null {
    return activeStore;
}

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
    if (!activeStore) {
        throw new Error("[kernel] No store bound. Call initKernel() first.");
    }

    const dbBefore = activeStore.getState();

    // 1. Build middleware context
    let mwCtx: MiddlewareCtx = {
        command: cmd,
        db: dbBefore,
        handlerType: "unknown",
        effects: null,
    };

    // 2. Run before chain
    mwCtx = runBeforeChain(mwCtx);

    // 3. Resolve and execute handler/command
    const { type, payload } = mwCtx.command;
    const handler = getHandler(type);
    const command = getCommand(type);

    if (handler) {
        // ── defineHandler path: (db, payload) → db ──
        mwCtx.handlerType = "handler";
        const nextDb = handler(mwCtx.db, payload);
        activeStore.setState(() => nextDb);
    } else if (command) {
        // ── defineCommand path: (ctx, payload) → EffectMap ──
        mwCtx.handlerType = "command";
        const ctx: Context = { db: mwCtx.db };
        mwCtx.effects = command(ctx, payload);
    } else {
        console.warn(`[kernel] No handler or command registered for "${type}"`);
    }

    // 4. Run after chain (reverse order)
    mwCtx = runAfterChain(mwCtx);

    // 5. Execute effects (after middleware may have modified them)
    if (mwCtx.effects) {
        executeEffects(mwCtx.effects);
    }

    const dbAfter = activeStore.getState();

    // 6. Record transaction (always)
    const transaction: Transaction = {
        id: nextTransactionId++,
        timestamp: Date.now(),
        command: mwCtx.command,
        handlerType: mwCtx.handlerType,
        effects: mwCtx.effects,
        changes: computeChanges(dbBefore, dbAfter),
        dbBefore,
        dbAfter,
    };

    transactions.push(transaction);
}

function executeEffects(effectMap: EffectMap): void {
    if (!activeStore) return;

    for (const [key, value] of Object.entries(effectMap)) {
        if (value === undefined) continue;

        if (key === "db") {
            // Built-in: state update
            activeStore.setState(() => value);
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

function computeChanges(before: unknown, after: unknown): unknown {
    // Abstract — will be replaced by Immer patches later
    if (before === after) return null;
    return { changed: true };
}

// ─── Inspector API ───

export function getTransactions(): readonly Transaction[] {
    return transactions;
}

export function getLastTransaction(): Transaction | undefined {
    return transactions[transactions.length - 1];
}

export function travelTo(transactionId: number): void {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) {
        console.warn(`[kernel] Transaction ${transactionId} not found`);
        return;
    }
    if (!activeStore) return;
    activeStore.setState(() => tx.dbAfter);
}

export function clearTransactions(): void {
    transactions.length = 0;
    nextTransactionId = 0;
}
