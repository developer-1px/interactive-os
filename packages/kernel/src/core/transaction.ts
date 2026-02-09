/**
 * transaction — Transaction log, Inspector API, and state diff.
 *
 * Records every dispatch as a Transaction with scope information.
 * Provides time-travel and inspection capabilities.
 */

import { getActiveStore } from "./createStore.ts";
import type { Command } from "./tokens.ts";

// ─── Types ───

export type StateDiff = {
  path: string;
  from: unknown;
  to: unknown;
};

export type Transaction = {
  id: number;
  timestamp: number;
  command: Command;
  handlerScope: string;
  bubblePath: string[];
  effects: Record<string, unknown> | null;
  changes: StateDiff[];
  stateBefore: unknown;
  stateAfter: unknown;
};

// ─── Transaction Log ───

const MAX_TRANSACTIONS = 200;
const transactions: Transaction[] = [];
let nextTransactionId = 0;

/**
 * recordTransaction — append a transaction entry to the log.
 */
export function recordTransaction(
  command: Command,
  handlerScope: string,
  effects: Record<string, unknown> | null,
  stateBefore: unknown,
  stateAfter: unknown,
  bubblePath: string[],
): void {
  const transaction: Transaction = {
    id: nextTransactionId++,
    timestamp: Date.now(),
    command,
    handlerScope,
    bubblePath,
    effects,
    changes: computeChanges(stateBefore, stateAfter),
    stateBefore,
    stateAfter,
  };

  transactions.push(transaction);

  if (transactions.length > MAX_TRANSACTIONS) {
    transactions.splice(0, transactions.length - MAX_TRANSACTIONS);
  }
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
  const store = getActiveStore();
  if (!store) return;
  store.setState(() => tx.stateAfter);
}

export function clearTransactions(): void {
  transactions.length = 0;
  nextTransactionId = 0;
}

// ─── State Diff ───

function computeChanges(before: unknown, after: unknown): StateDiff[] {
  if (before === after) return [];

  const diffs: StateDiff[] = [];

  function walk(a: unknown, b: unknown, path: string, depth: number): void {
    if (a === b) return;
    if (depth > 10) {
      diffs.push({ path, from: a, to: b });
      return;
    }

    const aIsObj = a !== null && typeof a === "object" && !Array.isArray(a);
    const bIsObj = b !== null && typeof b === "object" && !Array.isArray(b);

    if (aIsObj && bIsObj) {
      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
      for (const key of keys) {
        walk(aObj[key], bObj[key], path ? `${path}.${key}` : key, depth + 1);
      }
      return;
    }

    const aIsArr = Array.isArray(a);
    const bIsArr = Array.isArray(b);

    if (aIsArr && bIsArr) {
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        walk(a[i], b[i], `${path}[${i}]`, depth + 1);
      }
      return;
    }

    diffs.push({ path, from: a, to: b });
  }

  walk(before, after, "", 0);
  return diffs;
}
