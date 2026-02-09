/**
 * dispatch — Kernel's single entry point for all events.
 *
 * Event → Queue → Process:
 *   1. Look up handler or command
 *   2. Execute (pure function)
 *   3. Run effects
 *   4. Record transaction (always)
 *
 * Re-entrance safe via queue.
 */

import type { Store } from "./createStore.ts";
import type { Event, EffectMap, Context } from "./registry.ts";
import { getHandler, getCommand, getEffect } from "./registry.ts";

// ─── Transaction Log ───

export type Transaction = {
    id: number;
    timestamp: number;
    event: Event;
    handlerType: "handler" | "command" | "unknown";
    effects: EffectMap | null;
    changes: unknown;
    dbBefore: unknown;
    dbAfter: unknown;
};

const transactions: Transaction[] = [];
let nextTransactionId = 0;

// ─── Event Queue (re-entrance safe) ───

let queue: Event[] = [];
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

/**
 * dispatch — the single entry point.
 */
export function dispatch(event: Event): void {
    queue.push(event);

    if (processing) return; // queue will be drained by outer loop

    processing = true;
    while (queue.length > 0) {
        const next = queue.shift()!;
        processEvent(next);
    }
    processing = false;
}

function processEvent(event: Event): void {
    if (!activeStore) {
        throw new Error("[kernel] No store bound. Call initKernel() first.");
    }

    const { type, payload } = event;
    const dbBefore = activeStore.getState();

    // 1. Resolve handler type
    const handler = getHandler(type);
    const command = getCommand(type);

    let handlerType: Transaction["handlerType"] = "unknown";
    let effectMap: EffectMap | null = null;

    if (handler) {
        // ── defineHandler path: (db, payload) → db ──
        handlerType = "handler";
        const nextDb = handler(dbBefore, payload);
        activeStore.setState(() => nextDb);
    } else if (command) {
        // ── defineCommand path: (ctx, payload) → EffectMap ──
        handlerType = "command";
        const ctx: Context = { db: dbBefore };
        effectMap = command(ctx, payload);

        // Execute effects
        executeEffects(effectMap);
    } else {
        console.warn(`[kernel] No handler or command registered for "${type}"`);
    }

    const dbAfter = activeStore.getState();

    // 2. Record transaction (always)
    const transaction: Transaction = {
        id: nextTransactionId++,
        timestamp: Date.now(),
        event,
        handlerType,
        effects: effectMap,
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
            // Built-in: re-dispatch (goes to queue, processed after current event)
            const events = Array.isArray(value) ? value : [value];
            for (const e of events as Event[]) {
                dispatch(e);
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
